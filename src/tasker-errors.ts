
import { Task, Tasker } from "tasker";

export class TaskerUnreponsiveError extends Error {
    name = this.constructor.name;
    tasker: Tasker;

    constructor (tasker: Tasker) {
        super(`worker is unresponsive`);
        this.tasker = tasker;
    }
}

export class TaskerScriptError extends Error {
    name = this.constructor.name;
    tasker: Tasker;

    constructor (tasker: Tasker, error: any) {
        super(`script error caused by worker (${error.name})`);
        this.tasker = tasker;
        this.cause = error;
    }
}

export class TaskerDeadState extends Error {
    name = this.constructor.name;
    tasker: Tasker;

    constructor (tasker: Tasker, state: string) {
        super(`worker is in dead state (${state})`)
        this.tasker = tasker;
    }
}

export class TaskNotFound extends Error {
    name = this.constructor.name;
    tasker: Tasker;
    task: Task<any>;

    constructor (tasker: Tasker, job: Task<any>) {
        super("job not found in worker");
        this.tasker = tasker;
        this.task = job;
    }
}