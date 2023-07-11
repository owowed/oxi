import { Tasker } from "tasker";
export interface Task<Result, Args extends any[] = any> {
    callback: (...args: Args) => Result;
    args: Args;
}
export interface ParentMessageStatus {
    type: "status";
}
export interface ParentMessageTaskExecute {
    type: "task_execute";
    callbackCode: string;
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
    status: Tasker["status"];
}
export interface ChildMessageTaskFulfilled {
    type: "task_fulfilled";
    returnValue: any;
}
export interface ChildMessageTaskError {
    type: "task_error";
    error: any;
}
export type ParentMessage = ParentMessageStatus | ParentMessageTaskExecute | ParentMessageSuspend | ParentMessageResume | ParentMessageClose;
export type ChildMessage = ChildMessageStatus | ChildMessageTaskError | ChildMessageTaskFulfilled;
export type ParentMessageMap = {
    status: ParentMessageStatus;
    task_execute: ParentMessageTaskExecute;
    suspend: ParentMessageSuspend;
    resume: ParentMessageResume;
    close: ParentMessageClose;
};
export type ChildMessageMap = {
    status: ChildMessageStatus;
    task_fulfilled: ChildMessageTaskFulfilled;
    task_error: ChildMessageTaskError;
};
export interface AwaitMessageOptions<T extends ChildMessage = ChildMessage> {
    type: T["type"] | T["type"][];
    test: (message: T) => boolean | void;
    timeout: boolean | number;
}
export interface TaskerOptions {
    url: string;
}
