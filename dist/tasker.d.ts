import type { AwaitMessageOptions, ChildMessage, ChildMessageStatus, Task, TaskerOptions, ChildMessageMap } from "./tasker-types";
export * from "./tasker-types";
export * from "./tasker-errors";
export declare class TaskFulfilledEvent extends Event {
    task: Task<any>;
    result: any;
    constructor({ task, result }: {
        task: Task<any>;
        result: any;
    }, options?: EventInit);
}
export declare class TaskErrorEvent extends Event {
    task: Task<any>;
    error: any;
    constructor({ task, error }: {
        task: Task<any>;
        error: any;
    }, options?: EventInit);
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
export declare class Tasker extends EventTarget {
    #private;
    static readonly scriptUrl: string;
    static createTask<Result, Args extends any[]>(callback: (...args: Args) => Result, args?: Args): Readonly<Task<Result, Args>>;
    get worker(): Worker;
    set worker(worker: Worker);
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
    get status(): "shutdown" | "idling" | "working" | "suspended" | "terminated" | "error";
    constructor({ url }?: Partial<TaskerOptions>);
    work(): void;
    terminate(): void;
    reinit(worker?: Worker): void;
    shutdown(): Promise<ChildMessageStatus>;
    restart(worker?: Worker): Promise<void>;
    suspend(): Promise<ChildMessageStatus>;
    resume(): Promise<ChildMessageStatus>;
    execute<Result>(task: Task<Result>): Promise<Result>;
    run<Result, Args extends any[]>(callback: (...args: Args) => Result, args?: Args): Promise<Result>;
    queue<TTask extends Task<any>>(task: TTask): Readonly<TTask>;
    queue<Result, Args extends any[]>(callback: (...args: Args) => Result, args?: Args): Readonly<Task<Result, Args>>;
    remove(task: Task<any>): boolean;
    clearQueue(): void;
    awaitMessage<T extends keyof ChildMessageMap>(options: {
        type: T | T[];
    } & Partial<AwaitMessageOptions<ChildMessageMap[T]>>): Promise<ChildMessageMap[T]>;
    awaitMessage<Message extends ChildMessage>(options: Partial<AwaitMessageOptions<Message>>): Promise<Message>;
    awaitTask<Result>(task: Task<Result>): Promise<Result>;
}
