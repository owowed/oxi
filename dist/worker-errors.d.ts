import { Job, WorkerJQ } from "worker";
export declare class WorkerUnreponsiveError extends Error {
    name: string;
    worker: WorkerJQ;
    constructor(worker: WorkerJQ);
}
export declare class WorkerScriptError extends Error {
    name: string;
    worker: WorkerJQ;
    constructor(worker: WorkerJQ, error: any);
}
export declare class WorkerDeadState extends Error {
    name: string;
    worker: WorkerJQ;
    constructor(worker: WorkerJQ, state: string);
}
export declare class JobNotFound extends Error {
    name: string;
    worker: WorkerJQ;
    job: Job<any>;
    constructor(worker: WorkerJQ, job: Job<any>);
}
