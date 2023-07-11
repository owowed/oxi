
import type {
    AwaitMessageOptions,
    ChildMessage,
    ChildMessageTaskError,
    ChildMessageTaskFulfilled,
    ChildMessageStatus,
    Task,
    TaskerOptions,
    ParentMessage,
    ParentMessageClose,
    ParentMessageTaskExecute,
    ParentMessageResume,
    ParentMessageSuspend,
    ChildMessageMap,
} from "./tasker-types";

import {
    TaskNotFound,
    TaskerDeadState,
    TaskerScriptError,
    TaskerUnreponsiveError
} from "./tasker-errors";

export * from "./tasker-types";
export * from "./tasker-errors";

export class TaskFulfilledEvent extends Event {
    task: Task<any>;
    result: any;

    constructor ({ task, result }: { task: Task<any>, result: any }, options?: EventInit) {
        super("task_fulfilled", options);
        this.task = task;
        this.result = result;
    }
}

export class TaskErrorEvent extends Event {
    task: Task<any>;
    error: any;

    constructor ({ task, error }: { task: Task<any>, error: any }, options?: EventInit) {
        super("task_error", options);
        this.task = task;
        this.error = error;
    }
}

function workerLoop() {
    let state: Tasker["status"] = "idling";

    function runTask(data: ParentMessageTaskExecute) {
        state = "working";
        const callback = eval(`(${data.callbackCode})`);
        const args = data.args;

        try {
            const returnValue = callback(...args);
            if (returnValue instanceof Promise) {
                returnValue.then(returnValue => {
                    self.postMessage({
                        type: "task_fulfilled",
                        returnValue,
                    } satisfies ChildMessageTaskFulfilled);
                }).catch(error => {
                    self.postMessage({
                        type: "task_error",
                        error,
                    } satisfies ChildMessageTaskError);
                });
            }
            else {
                self.postMessage({
                    type: "task_fulfilled",
                    returnValue,
                } satisfies ChildMessageTaskFulfilled);
            }
        }
        catch (error) {
            self.postMessage({
                type: "task_error",
                error,
            } satisfies ChildMessageTaskError);
        }
        state = "idling";
    }

    self.addEventListener("message", (ev) => {
        const data = ev.data as ParentMessage;

        switch (data.type) {
        case "status":
            self.postMessage({
                type: "status",
                status: state
            } satisfies ChildMessageStatus);
            break;
        case "resume":
            state = "idling";
            break;
        }

        if (state == "suspended") return;

        switch (data.type) {
        case "task_execute":
            runTask(data);
            break;
        case "suspend":
            state = "suspended";
            break;
        case "shutdown":
            state = "shutdown";
            
            self.postMessage({
                type: "status",
                status: "shutdown"
            } satisfies ChildMessageStatus);

            self.close();
            break;
        }
    });
}

/**
 * Tasker is a task-based wrapper around {@link Worker} from Web Worker API.
 * 
 * Tasker works by executing the latest task from the queue, and then the next one until there is no more on the task list.
 * 
 * Task contains callback and arguments that are later evaluated in the worker enviroment.
 * 
 * Functions are passed between worker using `toString` API, and then are evaluated in the worker enviroment.
 * 
 * Variables from `window` or the main enviroment are not available in worker. You can pass them to the worker using Tasker `setVariable` method.
 * 
 * Functions and variables passed from window to worker are cloned or evaluated, and cannot be passed by reference.
 * 
 * Data cloning method may use `structuredClone` and `eval` function from the web API.
 */
export class Tasker extends EventTarget {
    static readonly scriptUrl = `data:text/javascript;charset=utf-8,(${workerLoop.toString()}).call(this)`;

    static createTask<Result, Args extends any[]>(callback: (...args: Args) => Result, args?: Args): Readonly<Task<Result, Args>> {
        return {
            callback,
            args: (args ?? []) as Args
        };
    }

    #taskQueue: Task<any>[] = [];
    #currentlyExecutingTask: Task<any> | null = null;
    #worker: Worker;
    #state: "idling" | "working" | "suspended" | "shutdown" | "terminated" | "error" = "idling";

    get worker() {
        return this.#worker;
    }

    set worker(worker: Worker) {
        this.reinit(worker);
    }

    /**
     * Returns Tasker status.
     * 
     * There are 6 Tasker status available:
     * - `idling` - Tasker is doing nothing.
     * - `working` - Tasker is executing remaining task in the queue.
     * - `suspended` - Tasker is executing a task once in the queue, and then no longer accept new task. Tasks that are not executed still remain in the queue.
     * - `shutdown` - Tasker is executing a task once in the queue, and then the `Worker` is closed. It will not execute remaining task in the queue. Same as "suspended", the tasks in the queue still remain.
     * - `terminated` - Tasker is immediately terminated, abandoning the task its executing. It will not execute remaining task in the queue. Same as "suspended", the tasks in the queue still remain.
     * - `error` - The last task Tasker executed throws an error, but still continuing remaining tasks.
     */
    get status() {
        return this.#state;
    }

    constructor ({ url }: Partial<TaskerOptions> = {}) {
        super();

        this.#worker = new Worker(url ?? Tasker.scriptUrl);

        this.work();
    }

    work() {
        if (this.#state == "idling" && this.#taskQueue.length > 0) {
            this.#state = "working";
            const task = this.#currentlyExecutingTask = this.#taskQueue.pop()!;
            const callback = () => {
                this.#state = "idling";
                this.#currentlyExecutingTask = null;
                this.work();
            };

            this.execute(task).then(callback).catch(callback);
        }
    }

    terminate() {
        this.#worker.terminate();
        this.#state = "terminated";
    }
    
    reinit(worker?: Worker) {
        worker ??= new Worker(Tasker.scriptUrl);
        this.terminate();
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

    async restart(worker?: Worker) {
        worker ??= new Worker(Tasker.scriptUrl);
        await this.shutdown();
        this.#state = "idling";
        this.#worker = worker;
        this.work();
    }

    async suspend() {
        this.#worker.postMessage({
            type: "suspend"
        } satisfies ParentMessageSuspend);

        this.#state = "suspended";

        return this.awaitMessage({ type: "status", test: message => message.status == "suspended" });
    }

    async resume() {
        this.#worker.postMessage({
            type: "resume"
        } satisfies ParentMessageResume);

        return this.awaitMessage({ type: "status", test: message => message.status == "idling" }).then(result => {
            this.#state = "idling";
            this.work();
            return result;
        });
    }

    async execute<Result>(task: Task<Result>): Promise<Result> {
        const data: ParentMessageTaskExecute = {
            type: "task_execute",
            callbackCode: task.callback.toString(),
            args: task.args
        };

        this.#worker.postMessage(data);

        const messageExecutionResult = await this.awaitMessage<ChildMessageTaskFulfilled | ChildMessageTaskError>({
            test: (message) => message.type == "task_fulfilled" || message.type == "task_error"
        });

        if (messageExecutionResult.type == "task_fulfilled") {
            const event = new TaskFulfilledEvent({ task, result: messageExecutionResult.returnValue });
            this.dispatchEvent(event);
            return messageExecutionResult.returnValue;
        }
        else {
            const taskerScriptError = new TaskerScriptError(this, messageExecutionResult.error);
            const event = new TaskErrorEvent({ task, error: taskerScriptError });
            this.dispatchEvent(event);
            throw taskerScriptError;
        }
    }

    async run<Result, Args extends any[]>(callback: (...args: Args) => Result, args?: Args): Promise<Result> {
        const task = this.queue(callback, args);
        return this.awaitTask(task);
    }

    queue<TTask extends Task<any>>(task: TTask): Readonly<TTask>;
    queue<Result, Args extends any[]>(callback: (...args: Args) => Result, args?: Args): Readonly<Task<Result, Args>>;
    queue(arg0: any, arg1?: any)
    {
        if (!(this.#state == "idling" || this.#state == "working")) throw new TaskerDeadState(this, this.#state);

        let task: Task<any>;
        
        if (typeof arg0 == "function") {
            task = Tasker.createTask(arg0, arg1);
        }
        else {
            task = arg0;
        }

        this.#taskQueue.push(task);

        this.work();

        return task;
    }

    remove(task: Task<any>) {
        const taskIndex = this.#taskQueue.indexOf(task);

        if (taskIndex == -1) {
            throw new TaskNotFound(this, task);
        }
        else {
            this.#taskQueue.splice(taskIndex, 1);
            return true;
        }
    }

    clearQueue() {
        this.#taskQueue.length = 0;
    }

    awaitMessage<T extends keyof ChildMessageMap>(options: { type: T | T[] } & Partial<AwaitMessageOptions<ChildMessageMap[T]>>): Promise<ChildMessageMap[T]>;
    awaitMessage<Message extends ChildMessage>(options: Partial<AwaitMessageOptions<Message>>): Promise<Message>;
    awaitMessage<Message extends ChildMessage>({ type, test, timeout = 50_000 }: Partial<AwaitMessageOptions> = {}): Promise<Message> {
        return new Promise(resolve => {
            let timeoutId: NodeJS.Timeout;

            this.#worker.addEventListener("message", (ev) => {
                const childMessage: ChildMessage = ev.data;
                if (type) {
                    if ((Array.isArray(type) && !type.includes(childMessage.type))
                    || (childMessage.type != type)) {
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
            }, { once: true });

            if (typeof timeout == "number") {
                timeoutId = setTimeout(() => {
                    throw new TaskerUnreponsiveError(this);
                }, timeout);
            }
        });
    }

    awaitTask<Result>(task: Task<Result>): Promise<Result> {
        if (!this.#taskQueue.includes(task) && this.#currentlyExecutingTask != task) throw new TaskNotFound(this, task);

        return new Promise((resolve, reject) => {
            this.addEventListener("task_fulfilled", (ev: any) => {
                const event = ev as TaskFulfilledEvent;
                if (event.task == task) {
                    resolve(event.result);
                }
            }, { once: true });
            this.addEventListener("task_error", (ev: any) => {
                const event = ev as TaskErrorEvent;
                if (event.task == task) {
                    reject(event.error);
                }
            }, { once: true });
        });
    }
}