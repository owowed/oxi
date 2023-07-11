import { Task, Tasker } from "tasker";
export declare class TaskerUnreponsiveError extends Error {
    name: string;
    tasker: Tasker;
    constructor(tasker: Tasker);
}
export declare class TaskerScriptError extends Error {
    name: string;
    tasker: Tasker;
    constructor(tasker: Tasker, error: any);
}
export declare class TaskerDeadState extends Error {
    name: string;
    tasker: Tasker;
    constructor(tasker: Tasker, state: string);
}
export declare class TaskNotFound extends Error {
    name: string;
    tasker: Tasker;
    task: Task<any>;
    constructor(tasker: Tasker, job: Task<any>);
}
