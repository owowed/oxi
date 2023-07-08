import { WorkerJQ } from "worker";


export interface WorkerPoolOptions {
    minPoolSize: number;
    maxPoolSize: number;
}

export class WorkerPool {
    #workerQueue: WorkerJQ[] = [];
    #minPoolSize = 4;
    #maxPoolSize = 6;

    constructor ({ minPoolSize, maxPoolSize }: Partial<WorkerPoolOptions> = {}) {
        // @ts-expect-error
        this.#minPoolSize ??= minPoolSize;
        // @ts-expect-error
        this.#maxPoolSize ??= maxPoolSize;
    }
}