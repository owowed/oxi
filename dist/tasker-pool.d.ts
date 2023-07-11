export interface TaskerPoolOptions {
    minPoolSize: number;
    maxPoolSize: number;
}
export declare class TaskerPool {
    #private;
    constructor({ minPoolSize, maxPoolSize }?: Partial<TaskerPoolOptions>);
}
