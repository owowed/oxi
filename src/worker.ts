
import type {
    AwaitMessageInit,
    ChildMessage,
    ChildMessageExecutionResultError,
    ChildMessageExecutionResultSuccess,
    ChildMessageStatus,
    Job,
    WorkerJQOptions,
    ParentMessage,
    ParentMessageClose,
    ParentMessageExecution,
    ParentMessageExecutionAsync,
    ParentMessageResume,
    ParentMessageSuspend,
} from "./worker-types";

import {
    JobNotFound,
    WorkerDeadState,
    WorkerScriptError,
    WorkerUnreponsiveError
} from "./worker-errors";

export * from "./worker-types";
export * from "./worker-errors";

export class JobDoneEvent extends Event {
    job: Job<any>;
    result: any;

    constructor ({ job, result }: { job: Job<any>, result: any }, options?: EventInit) {
        super("job-done", options);
        this.job = job;
        this.result = result;
    }
}

function workerLoop() {
    let state: WorkerJQ["state"] = "idling";

    function executeParentCode(data: ParentMessageExecution | ParentMessageExecutionAsync) {
        state = "working";
        const callback = eval(`(${data.functionCode})`);
        const args = data.args;

        try {
            const returnValue = callback(...args);
            self.postMessage({
                type: "execution_result",
                success: true,
                returnValue,
            } satisfies ChildMessageExecutionResultSuccess);
        }
        catch (error) {
            self.postMessage({
                type: "execution_result",
                success: false,
                error,
            } satisfies ChildMessageExecutionResultError);
        }
        state = "idling";
    }
    
    async function executeParentCodeAsync(data: ParentMessageExecutionAsync) {
        state = "working";
        const callback = eval(`(${data.functionCode})`) as (...args: any[]) => Promise<any>;
        const args = data.args;

        callback(...args)
            .then(returnValue => {
                self.postMessage({
                    type: "execution_result",
                    success: true,
                    returnValue,
                } satisfies ChildMessageExecutionResultSuccess);
                state = "idling";
            })
            .catch(error => {
                self.postMessage({
                    type: "execution_result",
                    success: false,
                    error,
                } satisfies ChildMessageExecutionResultError);
                state = "idling";
            });
    }
    
    self.addEventListener("message", (ev) => {
        const data = ev.data as ParentMessage;

        switch (data.type) {
        case "status":
            const respond: ChildMessageStatus = {
                type: "status",
                status: state
            };

            self.postMessage(respond);
            break;
        case "resume":
            state = "idling";
            break;
        }

        if (state == "suspended") return;

        switch (data.type) {
        case "execute":
            executeParentCode(data);
            break;
        case "execute_async":
            if (data.shouldAwait) {
                executeParentCodeAsync(data);
            }
            else {
                executeParentCode(data);
            }
            break;
        case "suspend":
            state = "suspended";
            break;
        case "shutdown":
            state = "shutdown";
            self.postMessage({ type: "status", status: "shutdown" } satisfies ChildMessageStatus);
            self.close();
            break;
        }
    });
}

/**
 * WorkerJQ is a queue-based wrapper around {@link Worker} from Web Worker API.
 * 
 * Developer can queue multiple jobs to WorkerJQ, then the class will manage its job by executing the last job on the queue, then waiting into the next one.
 */
export class WorkerJQ extends EventTarget {
    static readonly scriptUrl = `data:text/javascript;charset=utf-8,(${workerLoop.toString()}).call(this)`;

    #jobQueue: Job<any>[] = [];
    #currentlyExecutingJob: Job<any> | null = null;
    #worker: Worker;
    #state: "idling" | "working" | "suspended" | "shutdown" | "terminated" | "error" = "idling";

    constructor ({ url }: Partial<WorkerJQOptions> = {}) {
        super();

        this.#worker = new Worker(url ?? WorkerJQ.scriptUrl);

        this.work();
    }

    get worker() {
        return this.#worker;
    }

    set worker(worker: Worker) {
        this.reinit(worker);
    }

    get state() {
        return this.#state;
    }

    work() {
        if (this.#state == "idling" && this.#jobQueue.length > 0) {
            this.#state = "working";
            const job = this.#currentlyExecutingJob = this.#jobQueue.pop()!;

            this.execute(job).then(result => {
                this.#state = "idling";
                this.#currentlyExecutingJob = null;
                const event = new JobDoneEvent({ job, result });
                this.dispatchEvent(event);
                this.work();
            });
        }
    }

    clearQueue() {
        this.#jobQueue.length = 0;
    }

    reinit(worker?: Worker) {
        worker ??= new Worker(WorkerJQ.scriptUrl);
        this.terminate();
        this.#state = "idling";
        this.#worker = worker;
        this.work();
    }

    terminate() {
        this.#worker.terminate();
    }

    async restart(worker?: Worker) {
        worker ??= new Worker(WorkerJQ.scriptUrl);
        await this.shutdown();
        this.#state = "idling";
        this.#worker = worker;
        this.work();
    }

    async shutdown() {
        this.#worker.postMessage({
            type: "shutdown"
        } satisfies ParentMessageClose);

        return this.awaitMessage({ type: "status", test: (message) => message.status == "shutdown" }).then(result => {
            this.#state = "shutdown";
            return result;
        });
    }

    async suspend() {
        this.#worker.postMessage({
            type: "suspend"
        } satisfies ParentMessageSuspend);

        this.#state = "suspended";
    }

    async resume() {
        this.#worker.postMessage({
            type: "resume"
        } satisfies ParentMessageResume);

        this.#state = "idling";
        this.work();
    }

    async execute<Result>(job: Job<Result>): Promise<Result> {
        const data: ParentMessageExecution = {
            type: "execute",
            functionCode: job.callback.toString(),
            args: job.args
        };

        this.#worker.postMessage(data);

        const messageExecutionResult = await this.awaitMessage<"execution_result">({ type: "execution_result" });

        if (messageExecutionResult.success) {
            return messageExecutionResult.returnValue;
        }
        else {
            throw new WorkerScriptError(this, messageExecutionResult.error);
        }
    }

    async run<Result, Args extends any[]>(callback: (...args: Args) => Result, args?: Args): Promise<Result> {
        const job = this.queue(callback, args);
        return this.awaitJobDone(job);
    }

    queue<Result, Args extends any[]>(callback: (...args: Args) => Result, args?: Args): Readonly<Job<Result, Args>> {
        if (!(this.#state == "idling" || this.#state == "working")) throw new WorkerDeadState(this, this.#state);

        const job: Job<Result, Args> = {
            callback,
            // @ts-ignore
            args: args ?? [] as any[],
        };

        this.#jobQueue.push(job);

        this.work();

        return job;
    }

    remove(job: Job<any>) {
        const jobIndex = this.#jobQueue.indexOf(job);

        if (jobIndex == -1) {
            return false;
        }
        else {
            this.#jobQueue.splice(jobIndex, 1);
            return true;
        }
    }

    awaitMessage<Type extends ChildMessage["type"]>(options: { type: Type } & Partial<AwaitMessageInit<Extract<ChildMessage, { type: Type }>>>): Promise<Extract<ChildMessage, { type: Type }>>;
    awaitMessage<Message extends ChildMessage>({ type, test, timeout = 50_000 }: Partial<AwaitMessageInit> = {}): Promise<Message> {
        return new Promise(resolve => {
            let timeoutId: NodeJS.Timeout;

            this.#worker.addEventListener("message", (ev) => {
                const childMessage: ChildMessage = ev.data;
                if (type) {
                    if (childMessage.type != type) {
                        return;
                    }
                }
                if (test) {
                    if (!test(childMessage)) {
                        return;
                    }
                }
                if (timeoutId) clearTimeout(timeoutId);
                resolve(childMessage as Message);
            });

            if (typeof timeout == "number") {
                timeoutId = setTimeout(() => {
                    throw new WorkerUnreponsiveError(this);
                }, timeout);
            }
        });
    }

    awaitJobDone<Result>(job: Job<Result>): Promise<Result> {
        if (!this.#jobQueue.includes(job) && this.#currentlyExecutingJob != job) throw new JobNotFound(this, job);

        return new Promise(resolve => {
            this.addEventListener("job-done", (ev) => {
                const event = ev as JobDoneEvent;
                if (event.job == job) {
                    resolve(event.result);
                }
            });
        })
    }
}