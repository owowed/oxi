
import { Tasker } from "tasker";

export interface TaskerPoolOptions {
    minPoolSize: number;
    maxPoolSize: number;
}

export class TaskerPool {
    #workerQueue: Tasker[] = [];
    #minPoolSize = 4;
    #maxPoolSize = 6;

    constructor ({ minPoolSize, maxPoolSize }: Partial<TaskerPoolOptions> = {}) {
        // @ts-expect-error
        this.#minPoolSize ??= minPoolSize;
        // @ts-expect-error
        this.#maxPoolSize ??= maxPoolSize;
    }
}