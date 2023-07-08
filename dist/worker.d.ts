import type { AwaitMessageInit, ChildMessage, ChildMessageStatus, Job, WorkerJQOptions } from "./worker-types";
export * from "./worker-types";
export * from "./worker-errors";
export declare class JobDoneEvent extends Event {
    job: Job<any>;
    result: any;
    constructor({ job, result }: {
        job: Job<any>;
        result: any;
    }, options?: EventInit);
}
/**
 * WorkerJQ is a queue-based wrapper around {@link Worker} from Web Worker API.
 *
 * Developer can queue multiple jobs to WorkerJQ, then the class will manage its job by executing the last job on the queue, then waiting into the next one.
 */
export declare class WorkerJQ extends EventTarget {
    #private;
    static readonly scriptUrl: string;
    constructor({ url }?: Partial<WorkerJQOptions>);
    get worker(): Worker;
    set worker(worker: Worker);
    get state(): "shutdown" | "idling" | "working" | "suspended" | "terminated" | "error";
    work(): void;
    clearQueue(): void;
    reinit(worker?: Worker): void;
    terminate(): void;
    restart(worker?: Worker): Promise<void>;
    shutdown(): Promise<ChildMessageStatus>;
    suspend(): Promise<void>;
    resume(): Promise<void>;
    execute<Result>(job: Job<Result>): Promise<Result>;
    run<Result, Args extends any[]>(callback: (...args: Args) => Result, args?: Args): Promise<Result>;
    queue<Result, Args extends any[]>(callback: (...args: Args) => Result, args?: Args): Readonly<Job<Result, Args>>;
    remove(job: Job<any>): boolean;
    awaitMessage<Type extends ChildMessage["type"]>(options: {
        type: Type;
    } & Partial<AwaitMessageInit<Extract<ChildMessage, {
        type: Type;
    }>>>): Promise<Extract<ChildMessage, {
        type: Type;
    }>>;
    awaitJobDone<Result>(job: Job<Result>): Promise<Result>;
}
