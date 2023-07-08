
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

export type ObserveMutationCallback = (info: { records: MutationRecord[], observer: MutationObserver }) => void;

/**
* Create a new `MutationObserver` with options and callback.
* @param {ObserveMutationOptions} options 
* @param {ObserveMutationCallback} callback 
* @returns {MutationObserver}
*/
export function observeMutation({ target, abortSignal, once, ...options }: ObserveMutationOptions, callback: ObserveMutationCallback): MutationObserver {
   const observer = new MutationObserver(records => {
        if (once) observer.disconnect();
        callback({ records, observer });
   });

   observer.observe(target, options);

   abortSignal?.addEventListener("abort", () => {
       observer.disconnect();
   });

   return observer;
}

/**
* Create a new `MutationObserver` that only executes once.
* @param {ObserveMutationOptions} options 
* @param {ObserveMutationCallback} callback 
* @returns {MutationObserver}
*/
export function observeMutationOnce(options: ObserveMutationOptions, callback: ObserveMutationCallback): MutationObserver {
    return observeMutation({ once: true, ...options }, callback);
}

/**
* Create a new `MutationObserver` asyncronously that only executes once.
* @param {ObserveMutationOptions} options 
* @param {ObserveMutationCallback} callback 
* @returns {MutationObserver}
*/
export function observeMutationAsync({ target, abortSignal, ...options }: ObserveMutationOptions, callback: ObserveMutationCallback): Promise<{ records: MutationRecord[], observer: MutationObserver }> {
    return new Promise(resolve => {
        const observer = new MutationObserver(records => {
            observer.disconnect();
            resolve({ records, observer });
        });

        observer.observe(target, options);

        abortSignal?.addEventListener("abort", () => {
            observer.disconnect();
        });
    });
}

export const makeMutationObserver = observeMutation;