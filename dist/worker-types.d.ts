import { WorkerJQ } from "worker";
export interface Job<Result, Args extends any[] = any> {
    callback: (...args: Args) => Result;
    args: Args;
}
export interface ParentMessageStatus {
    type: "status";
}
export interface ParentMessageExecution {
    type: "execute";
    functionCode: string;
    args: any[];
}
export interface ParentMessageExecutionAsync {
    type: "execute_async";
    functionCode: string;
    shouldAwait: boolean;
    args: any[];
}
export interface ParentMessageSuspend {
    type: "suspend";
}
export interface ParentMessageResume {
    type: "resume";
}
export interface ParentMessageClose {
    type: "shutdown";
}
export interface ChildMessageStatus {
    type: "status";
    status: WorkerJQ["state"];
}
export interface ChildMessageExecutionResultSuccess {
    type: "execution_result";
    success: true;
    returnValue: any;
}
export interface ChildMessageExecutionResultError {
    type: "execution_result";
    success: false;
    error: any;
}
export type ParentMessage = ParentMessageStatus | ParentMessageExecutionAsync | ParentMessageExecution | ParentMessageSuspend | ParentMessageResume | ParentMessageClose;
export type ChildMessage = ChildMessageStatus | ChildMessageExecutionResultError | ChildMessageExecutionResultSuccess;
export interface WorkerUnreponsiveErrorInit {
    worker: WorkerJQ;
}
export interface AwaitMessageInit<T extends ChildMessage = ChildMessage> {
    type: T["type"];
    test: (message: T) => boolean | void;
    timeout: boolean | number;
}
export interface WorkerJQOptions {
    url: string;
}
