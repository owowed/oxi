/**
 * Configuration used for {@link observeMutation} and {@link MutationObserver}.
 */
export interface ObserveMutationOptions extends MutationObserverInit {
    /**
     * Target node for mutation observer. This will be used for `MutationObserver.observe`.
     */
    target: Node;
    /**
     * Abort signal used for disconnecting mutation observer.
     *
     * If abort signal is aborted, then mutation observer is disconnected.
     */
    abortSignal?: AbortSignal;
    /**
     * This will make mutation observer disconnect after detecting mutation once.
     */
    once?: boolean;
}
export type ObserveMutationCallback = (info: {
    records: MutationRecord[];
    observer: MutationObserver;
}) => void;
/**
* Create a new `MutationObserver` with options and callback.
* @param {ObserveMutationOptions} options
* @param {ObserveMutationCallback} callback
* @returns {MutationObserver}
*/
export declare function observeMutation({ target, abortSignal, once, ...options }: ObserveMutationOptions, callback: ObserveMutationCallback): MutationObserver;
/**
* Create a new `MutationObserver` that only executes once.
* @param {ObserveMutationOptions} options
* @param {ObserveMutationCallback} callback
* @returns {MutationObserver}
*/
export declare function observeMutationOnce(options: ObserveMutationOptions, callback: ObserveMutationCallback): MutationObserver;
/**
* Create a new `MutationObserver` asyncronously that only executes once.
* @param {ObserveMutationOptions} options
* @param {ObserveMutationCallback} callback
* @returns {MutationObserver}
*/
export declare function observeMutationAsync({ target, abortSignal, ...options }: ObserveMutationOptions, callback: ObserveMutationCallback): Promise<{
    records: MutationRecord[];
    observer: MutationObserver;
}>;
export declare const makeMutationObserver: typeof observeMutation;
