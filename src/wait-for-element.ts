
import { makeMutationObserver } from "./make-mutation-observer";

/**
 * Interface for options used in {@link waitForElementByOptions}, used for configuring how its operation works.
 */
export interface WaitForElementOptions {
    /** 
     * If set to true, it will select element by ID, and it will use the {@link document.documentElement} as the parent selector. {@link WaitForElementOptions.parent} will not apply.
     * 
     * This option will precede any other options, such as {@link WaitForElementOptions.multiple} option and the {@link WaitForElementOptions.selector} option, meaning the operation will always select element by the ID specified by {@link WaitForElementOptions.id} option, even if {@link WaitForElementOptions.multiple} or {@link WaitForElementOptions.selector} option is set.
     */
    id?: string;
    /** 
     * The selector for the element.
     * 
     * If set to `string[]`, then it will query select single element for each selector in the array, returning array of element.
     * 
     * If {@link WaitForElementOptions.multiple} option is set to true, then it will query select all element for each selector in array, and then combines them into one, returning array of element.
     * @see {@link WaitForElementOptions.parent} for limiting the scope of query selector
     * @see {@link WaitForElementOptions.id} for getting element only by ID
     */
    selector?: string | string[];
    /** 
     * If {@link ParentNode} is passed, it will use the {@link WaitForElementOptions.parent} element as the parent selector.
     * 
     * This option will limit the scope of the query selector from the {@link WaitForElementOptions.parent} element. This may be useful for optimizing performance.
     */
    parent?: ParentNode;
    /**
     * If set with {@link AbortSignal} instance, user will able to abort this operation by using {@link AbortSignal.abort}.
     */
    abortSignal?: AbortSignal;
    /**
     * If set to true, this operation will query select multiple element by using {@link ParentNode.querySelectorAll} instead of {@link ParentNode.querySelector}.
     */
    multiple?: boolean;
    /**
     * Enable timeout for waiting operation.
     * 
     * If waiting operation reaches timeout, it will throw {@link WaitForElementTimeoutError} or return null, depending on {@link WaitForElementOptions.throwError} option.
     * 
     * The timeout is set by {@link WaitForElementOptions.timeout} option. The timeout is set in millisecond.
     */
    enableTimeout?: boolean;
    /**
     * Set the timeout in millisecond. Default timeout is 5 seconds.
     * 
     * This option will do nothing if {@link WaitForElementOptions.enableTimeout} is set to false.
     * @see {@link WaitForElementOptions.enableTimeout}
     */
    timeout?: number;
    /**
     * Set how many attempt this operation can query select the target element.
     * 
     * If it reaches max attempt, it will throw {@link WaitForElementMaximumTriesError} or return null, depending on {@link WaitForElementOptions.throwError} option.
     */
    maxTries?: number;
    /**
     * Ensure DOM content loaded by listening to `DOMContentLoad` event, or checking {@link document.readyState} before running this operation.
     */
    ensureDomContentLoaded?: boolean;
    /** 
     * Set options for {@link MutationObserver} used in this operation.
     */
    observerOptions?: MutationObserverInit;
    /**
     * Filter the target element(s) before being returned.
     */
    filter?: (elem: Element | null) => boolean;
    /** 
     * Transform the target element(s) before being returned.
     */
    transform?: (elem: Element | null) => Element;
}

export type WaitForElementReturnType = HTMLElement | HTMLElement[] | null;

type SingleElementOptions = WaitForElementOptions & ({ multiple: false } | { id: string });
type ArrayElementOptions = WaitForElementOptions & { multiple: true };
type SingleElementTagNameOptions<T extends keyof HTMLElementTagNameMap> = WaitForElementOptions & { selector: T; multiple: false };

/**
 * Wait and get element that is not yet available in DOM by using element's ID asyncronously. It will use {@link document.getElementById} internally for getting the element.
 * 
 * This is a simple wrapper around {@link waitForElementByOptions}.
 * @param id specify element's ID value
 * @param options specify additional options for {@link waitForElementByOptions}
 * @returns element with specified ID or null if element not found or something went wrong
 * @see {@link WaitForElementOptions}
 * @see {@link waitForElementByOptions}
 */
export function waitForElementById<E extends Element>(id: string): Promise<E | null> {
    return waitForElementByOptions({ id })
}

/**
 * Wait for element that is not available yet in the DOM asyncronously, then return that element.
 * 
 * Instead of query selecting element through {@link document.documentElement}, it will instead use the parent element specified by the `parent` parameter as the scope for query selection.
 * 
 * This may help optimize performance, searching element through specific scope of another element instead of the entire document.
 * 
 * This is a simple wrapper around {@link waitForElementByOptions}.
 * @param parent specify scope for target element query selection by parent element
 * @param selector specify selector for the target element
 * @param options specify additional options for {@link waitForElementByOptions}
 * @returns return multiple elements in {@link Array}, a single element or null depending on the parameters
 * @see {@link WaitForElementOptions}
 * @see {@link waitForElementByOptions}
 */
export function waitForElementByParent<T extends keyof HTMLElementTagNameMap>(parent: ParentNode, selector: T, options?: SingleElementTagNameOptions<T>): Promise<HTMLElementTagNameMap[T] | null>;
export function waitForElementByParent<E extends Element>(parent: ParentNode, selector: string, options?: SingleElementOptions): Promise<E | null>;
export function waitForElementByParent<E extends Element>(parent: ParentNode, selector: string, options?: ArrayElementOptions): Promise<E[] | null>;
export function waitForElementByParent<E extends Element>(parent: ParentNode, selector: string, options?: WaitForElementOptions): Promise<E | null>;
export function waitForElementByParent<E extends Element>(parent: ParentNode, selector: string[], options?: WaitForElementOptions): Promise<E[] | null>;
export function waitForElementByParent(parent: any, selector: any, options: any = {}): any {
    return waitForElementByOptions({ selector, parent, ...options });
}

/**
 * Wait for element that is not available yet in the DOM asyncronously, then return that element.
 * 
 * This is a simple wrapper around {@link waitForElementByOptions}.
 * @param selector specify selector for the target element
 * @param options specify additional options for {@link waitForElementByOptions}
 * @returns return multiple elements in {@link Array}, a single element or null depending on the parameters
 * @see {@link WaitForElementOptions}
 * @see {@link waitForElementByOptions}
 */
export function waitForElement<T extends keyof HTMLElementTagNameMap>(selector: T, options?: SingleElementTagNameOptions<T>): Promise<HTMLElementTagNameMap[T] | null>;
export function waitForElement<E extends Element>(selector: string, options?: SingleElementOptions): Promise<E | null>;
export function waitForElement<E extends Element>(selector: string, options?: ArrayElementOptions): Promise<E[] | null>;
export function waitForElement<E extends Element>(selector: string, options?: WaitForElementOptions): Promise<E | null>;
export function waitForElement<E extends Element>(selector: string[], options?: WaitForElementOptions): Promise<E[] | null>;
export function waitForElement(selector: any, options: any = {}): any {
    return waitForElementByOptions({ selector, ...options });
}

/**
 * Wait for element that is not available yet in the DOM asyncronously, then return that element.
 * 
 * This operation works by listening for DOM (or an parent element specified by {@link WaitForElementOptions.parent}) subtree changes using {@link MutationObserver}, then execute element selection each time changes happen.
 * 
 * If an element not found, then it will attempt to retry the same operation again. This can be controlled by using {@link WaitForElementOptions.maxTries}, {@link WaitForElementOptions.timeout}, and etc.
 * 
 * Behavior described here may not be accurate if options are specifically configured.
 * 
 * @param options configure how the operation works by specifying options
 * @returns depending on the options, it may return multiple elements in {@link Array}, a single element, or null if element not found or something went wrong
 * @see {@link WaitForElementOptions}
 * @see {@link waitForElement}
 */
export function waitForElementByOptions<T extends keyof HTMLElementTagNameMap>(options: SingleElementTagNameOptions<T>): Promise<HTMLElementTagNameMap[T] | null>;
export function waitForElementByOptions<E extends Element>(options: SingleElementOptions): Promise<E | null>;
export function waitForElementByOptions<E extends Element>(options: ArrayElementOptions): Promise<E[] | null>;
export function waitForElementByOptions<E extends Element>(options: WaitForElementOptions & { selector: string }): Promise<E | null>;
export function waitForElementByOptions<E extends Element>(options: WaitForElementOptions & { selector: string[] }): Promise<E[] | null>;
export function waitForElementByOptions(
    { id,
        selector,
        parent = document.documentElement,
        abortSignal,
        multiple = false,
        timeout = 5000,
        enableTimeout = true,
        maxTries = Number.MAX_SAFE_INTEGER,
        ensureDomContentLoaded = true,
        observerOptions = {},
        filter,
        transform }: WaitForElementOptions = {}) {
    return new Promise((resolve, reject) => {
        let result: Element | Element[] | null,
            tries = 0;

        if (ensureDomContentLoaded && document.readyState == "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                initQueryElement();
            });
        }
        else {
            initQueryElement();
        }

        function initQueryElement() {
            const firstResult = processQueryElement();

            if (firstResult) return;
            
            let observer = makeMutationObserver(
                { target: parent,
                    childList: true,
                    subtree: true,
                    abortSignal,
                    ...observerOptions },
                () => processQueryElement(observer));
    
            let timeoutId = -1;
    
            if (enableTimeout) {
                timeoutId = window.setTimeout(() => {
                    observer.disconnect();
                    resolve(null);
                }, timeout);
            }
    
            abortSignal?.addEventListener("abort", () => {
                clearTimeout(timeoutId);
                observer.disconnect();
                resolve(null);
            });
    
            processQueryElement();
        }

        function processQueryElement(observer?: MutationObserver) {
            abortSignal?.throwIfAborted();

            if (multiple && selector != undefined && id == undefined) {
                if (Array.isArray(selector)) {
                    result = [];
                    for (const sel of selector) {
                        result = result.concat(Array.from(parent.querySelectorAll(sel)));
                    }
                }
                else {
                    result = Array.from(applyFilterTransform(parent.querySelectorAll(selector)));
                }
            }
            else {
                if (id) {
                    result = document.getElementById(id);
                }
                else if (Array.isArray(selector)) {
                    result = [];

                    result = Array.from(applyFilterTransform(parent.querySelectorAll(selector.join(", "))));
                }
                else if (typeof selector == "string") {
                    result = parent.querySelector(selector);

                    if (transform) result = transform(result);
                    if (filter != undefined && !filter(result)) {
                        return null;
                    }
                }
                else {
                    return null;
                }
            }

            function* applyFilterTransform(elements: Iterable<Element>) {
                for (let elem of elements) {
                    if (filter != null && filter(elem)) {
                        if (transform) elem = transform(elem);
                        yield elem;
                    }
                    else if (filter == null && transform) {
                        yield transform(elem);
                    }
                }
            }


            if (multiple && Array.isArray(result) ? result.length > 0 : result) {
                observer?.disconnect();
                resolve(result);
                return result;
            }

            tries++;

            if (tries >= maxTries) {
                observer?.disconnect();                
                resolve(null);
                return null;
            }
        }
    });
}