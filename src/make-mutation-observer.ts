
/**
 * Configuration used for {@link makeMutationObserver} and {@link MutationObserver}.
 */
export interface MakeMutationObserverInit extends MutationObserverInit {
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

export type MakeMutationObserverCallback = (info: { records: MutationRecord[], observer: MutationObserver }) => void;

/**
* Create a new `MutationObserver` with options and callback.
* @param {MakeMutationObserverInit} options 
* @param {MakeMutationObserverCallback} callback 
* @returns {MutationObserver}
*/
export function makeMutationObserver({ target, abortSignal, once, ...options }: MakeMutationObserverInit, callback: MakeMutationObserverCallback): MutationObserver {
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