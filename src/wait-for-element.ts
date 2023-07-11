
import {
    WaitForElementMissingOptionError,
    WaitForElementMaxTriesError,
    WaitForElementTimeoutError
} from "./wait-for-element-errors";

import { observeMutation } from "./mutation-observer";

export type QueryFnDefault<QueryFnResult> = (parent: ParentNode, selector: string) => QueryFnResult | null;

export type QueryOptions<QueryFnResult, QueryFn extends QueryFnDefault<QueryFnResult> = QueryFnDefault<QueryFnResult>> =
    ({
        /** Set to ID selector that the operation will query select.
         * 
         * If `id` and/or `selector` is not set, then it will throw {@link WaitForElementMissingOptionError}.
         * 
         * @see {@link document.getElementById}
         */
        id: string;
    } | {
        /**
         * Set to valid selector that the operation will query select.
         * 
         * If `id` and/or `selector` is not set, then it will throw {@link WaitForElementMissingOptionError}.
         * 
         * @see {@link document.querySelector} 
         */
        selector: string;
    })
    & {
        /**
         * Set to parent node that the operation will be query select from.
         * 
         * This will also set mutation observer's target.
         * 
         * By default, it will set to {@link document.documentElement}.
         */
        parent?: ParentNode;
        /**
         * Set to element or an operation that will be used for query selecting.
         * 
         * Can be set to {@link document.querySelector} or {@link document.querySelectorAll}.
         * 
         * By default, it will set to {@link document.querySelector}.
         * 
         * @see {@link document.querySelector}
         * @see {@link QueryOptions.parent}
         */
        querySelector?: QueryFn;
        /**
         * Set to abort signal from {@link AbortController} that will be used to abort the operation.
         * 
         * @see {@link AbortController}
         */
        abortSignal?: AbortSignal;
        /**
         * Set to milliseconds that will be used to timeout the operation.
         * 
         * If operation has timeout, then it will throw {@link WaitForElementTimeoutError}.
         * 
         * Set to `false` to disable timeout feature.
         * 
         * By default, it will set to `10_000` milliseconds.
         * 
         * @see {@link setTimeout}
         */
        timeout?: number | false;
        /**
         * Set to number which will determine how much the operation can be restarted.
         * 
         * If operation has reached max tries, then it will throw {@link WaitForElementMaxTriesError}.
         * 
         * By default, it will set to `Infinity`.
         */
        maxTries?: number;
        /**
         * Set to true if the operation will wait for `DOMContentLoaded` event.
         * 
         * By default, it will set to `true`.
         */
        ensureDomContentLoaded?: boolean;
        /**
         * Set to mutation observer's options for the operation's mutation observer options.
         * 
         * By default, the operation's will enable `childList` and `subtree` mutation observer option.
         * 
         * @see {@link MutationObserverInit}
         * @see {@link QueryOptions.parent}
         */
        observerOptions?: MutationObserverInit;
    };

export async function awaitDomContentLoaded(): Promise<void> {
    return new Promise(resolve => {
        if (document.readyState != "loading") return resolve();
        document.addEventListener("DOMContentLoaded", () => resolve());
    });
}

function isNotEmpty<T>(x: T): x is Exclude<T, null> {
    if (x instanceof NodeList && x.length > 0) {
        return true;
    }
    else {
        return x != null;
    }
}

export async function executeQuery
    <QueryFnResult, QueryFn extends QueryFnDefault<QueryFnResult> = QueryFnDefault<QueryFnResult>>
    (options: QueryOptions<QueryFnResult, QueryFn>): Promise<QueryFnResult>
{
    let selector: string;
    const parent = options.parent ?? document.body;
    const querySelector: QueryFn = options.querySelector ?? ((parent, selector) => parent.querySelector(selector)) as QueryFn;
    const maxTries = options.maxTries ?? Infinity;
    const timeout = options.timeout ?? 10_000;
    const ensureDomContentLoaded = options.ensureDomContentLoaded ?? true;

    if (ensureDomContentLoaded) await awaitDomContentLoaded();

    if ("id" in options) {
        selector = `#${options.id}`;
    }
    else if ("selector" in options) {
        selector = options.selector;
    }
    else {
        throw new WaitForElementMissingOptionError(`missing options "id" or "selector"`);
    }

    let result: QueryFnResult | null = querySelector(parent, selector);

    if (isNotEmpty(result)) return result;

    let tries = 0;

    const abortController = new AbortController;
    const abortSignal: AbortSignal = abortController.signal;

    options.abortSignal?.addEventListener("abort", () => abortController.abort());

    return new Promise((resolve, reject) => {
        const mutation = observeMutation({ target: parent, abortSignal, childList: true, subtree: true, ...options.observerOptions }, () => {
            result = querySelector(parent, selector);
            if (isNotEmpty(result)) {
                mutation.disconnect();
                resolve(result);
            }
            else if (tries > maxTries) {
                mutation.disconnect();
                reject(new WaitForElementMaxTriesError(maxTries));
            }
            tries++;
        });

        if (timeout != false && timeout != Infinity) {
            setTimeout(() => {
                mutation.disconnect();
                reject(new WaitForElementTimeoutError(timeout));
            }, timeout);
        }
    });
}

export function waitForElement<Elem extends Element>(selector: string, options?: Partial<QueryOptions<Elem>>): Promise<Elem>;
export function waitForElement<Elem extends Element>(selector: string, parent: ParentNode, options?: Partial<QueryOptions<Elem>>): Promise<Elem>;
export function waitForElement<T extends keyof HTMLElementTagNameMap>(selector: T, options?: Partial<QueryOptions<HTMLElementTagNameMap[T]>>): Promise<HTMLElementTagNameMap[T]>;
export function waitForElement<T extends keyof HTMLElementTagNameMap>(selector: T, parent: ParentNode, options?: Partial<QueryOptions<HTMLElementTagNameMap[T]>>): Promise<HTMLElementTagNameMap[T]>;
export function waitForElement(selector: string, arg1?: any, arg2?: any): any
{
    let options: QueryOptions<Element>;

    if (arg1 instanceof Node && "children" in arg1) {
        // arg1 is ParentNode
        options = {
            selector,
            parent: arg1 as ParentNode,
            ...arg2
        };
    }
    else {
        // arg1 is QueryOptions
        options = {
            selector,
            ...arg1
        };
    }

    return executeQuery({ selector, ...options });
}

export function waitForElementAll<Elem extends Element>(selector: string, options?: Partial<QueryOptions<NodeListOf<Elem>>>): Promise<Elem[]>;
export function waitForElementAll<Elems extends Element[]>(selector: string, options?: Partial<QueryOptions<NodeListOf<Element>>>): Promise<Elems>;
export function waitForElementAll(selector: string, options?: Partial<QueryOptions<NodeListOf<Element>>>): Promise<Element[]>
{
    return executeQuery<NodeListOf<Element>>({ selector, ...options }).then(i => Array.from(i));
}

export function waitForElementParent<Elem extends Element>(parent: ParentNode, selector: string, options?: Partial<QueryOptions<Elem>>): Promise<Elem> {
    return executeQuery({ selector, parent, ...options });
}

export function waitForElementId<Elem extends Element>(id: string, options?: Partial<QueryOptions<Elem>>): Promise<Elem> {
    return executeQuery<Elem>({ id, ...options });
}

export function waitForElementInf<Elem extends Element>(selector: string, options?: Partial<QueryOptions<Elem>>): Promise<Elem> {
    return executeQuery({ selector, timeout: Infinity, ...options });
}