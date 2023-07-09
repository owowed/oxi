export interface WorkerPoolOptions {
    minPoolSize: number;
    maxPoolSize: number;
}
export declare class WorkerPool {
    #private;
    constructor({ minPoolSize, maxPoolSize }?: Partial<WorkerPoolOptions>);
}
