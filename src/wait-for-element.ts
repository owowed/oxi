
import { WaitForElementMissingOptionError, WaitForElementMaxTriesError, WaitForElementTimeoutError } from "./wait-for-element-errors";
import { observeMutation } from "./mutation-observer";

export type QueryOptions<QueryFnResult, QueryFn extends (selector: string) => QueryFnResult | null = (selector: string) => QueryFnResult | null> =
    ({ id: string } | { selector: string })
    & {
        parent?: ParentNode;
        querySelector?: QueryFn;
        abortSignal?: AbortSignal;
        timeout?: number | false;
        maxTries?: number;
        ensureDomContentLoaded?: boolean;
        observerOptions?: MutationObserverInit;
    };

export async function executeQuery
    <QueryFnResult, QueryFn extends (selector: string) => QueryFnResult | null = (selector: string) => QueryFnResult | null>
    (options: QueryOptions<QueryFnResult, QueryFn>): Promise<QueryFnResult>
{
    let selector: string;
    const parent = options.parent ?? document.body;
    const querySelector: QueryFn = options.querySelector ?? document.querySelector as QueryFn;
    const maxTries = options.maxTries ?? Infinity;
    const timeout = options.timeout ?? 10_000;

    if ("id" in options) {
        selector = `#${options.id}`;
    }
    else if ("selector" in options) {
        selector = options.selector;
    }
    else {
        throw new WaitForElementMissingOptionError(`missing options "id" or "selector"`);
    }

    let result: QueryFnResult | null = querySelector(selector);

    if (result) return result;

    let tries = 0;

    const abortController = new AbortController;
    const abortSignal: AbortSignal = abortController.signal;

    options.abortSignal?.addEventListener("abort", () => abortController.abort());

    return new Promise((resolve, reject) => {
        const mutation = observeMutation({ target: parent, abortSignal, childList: true, subtree: true, ...options.observerOptions }, () => {
            result = querySelector(selector);
            if (result != null) {
                resolve(result);
                mutation.disconnect();
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

export function waitForElement<Elem extends Element>(selector: string, options: QueryOptions<Elem>): Promise<Elem> {
    return executeQuery({ selector, ...options });
}

export function waitForElementAll(selector: string, options: QueryOptions<NodeListOf<Element>>): Promise<Element[]> {
    return executeQuery<NodeListOf<Element>>({ selector, ...options }).then(i => Array.from(i));
}

export function waitForElementParent<Elem extends Element>(parent: ParentNode, selector: string, options: QueryOptions<Elem>): Promise<Elem> {
    return executeQuery({ selector, parent, ...options });
}

export function waitForElementId<Elem extends Element>(id: string, options: QueryOptions<Elem>): Promise<Elem> {
    return executeQuery<Elem>({ id, ...options });
}

export function waitForElementInf<Elem extends Element>(selector: string, options: QueryOptions<Elem>): Promise<Elem> {
    return executeQuery({ selector, timeout: Infinity, ...options });
}