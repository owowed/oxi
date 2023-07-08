
import { Job, WorkerJQ } from "worker";

export class WorkerUnreponsiveError extends Error {
    name = this.constructor.name;
    worker: WorkerJQ;

    constructor (worker: WorkerJQ) {
        super(`worker is unresponsive`);
        this.worker = worker;
    }
}

export class WorkerScriptError extends Error {
    name = this.constructor.name;
    worker: WorkerJQ;

    constructor (worker: WorkerJQ, error: any) {
        super(`script error caused by worker (${error.name})`);
        this.worker = worker;
        this.cause = error;
    }
}

export class WorkerDeadState extends Error {
    name = this.constructor.name;
    worker: WorkerJQ;

    constructor (worker: WorkerJQ, state: string) {
        super(`worker is in dead state (${state})`)
        this.worker = worker;
    }
}

export class JobNotFound extends Error {
    name = this.constructor.name;
    worker: WorkerJQ;
    job: Job<any>;

    constructor (worker: WorkerJQ, job: Job<any>) {
        super("job not found in worker");
        this.worker = worker;
        this.job = job;
    }
}