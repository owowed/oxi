export interface MakeMutationObserverInit extends MutationObserverInit {
    target: Node;
    abortSignal?: AbortSignal;
    once?: boolean;
}
export type MakeMutationObserverCallback = (info: {
    records: MutationRecord[];
    observer: MutationObserver;
}) => void;
/**
* Create a new `MutationObserver` with options and callback.
* @param {MakeMutationObserverInit} options
* @param {MakeMutationObserverCallback} callback
* @returns {MutationObserver}
*/
export declare function makeMutationObserver({ target, abortSignal, once, ...options }: MakeMutationObserverInit, callback: MakeMutationObserverCallback): MutationObserver;
