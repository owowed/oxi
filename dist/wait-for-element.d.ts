export type QueryFnDefault<QueryFnResult> = (parent: ParentNode, selector: string) => QueryFnResult | null;
export type QueryOptions<QueryFnResult, QueryFn extends QueryFnDefault<QueryFnResult> = QueryFnDefault<QueryFnResult>> = ({
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
}) & {
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
export declare function awaitDomContentLoaded(): Promise<void>;
export declare function executeQuery<QueryFnResult, QueryFn extends QueryFnDefault<QueryFnResult> = QueryFnDefault<QueryFnResult>>(options: QueryOptions<QueryFnResult, QueryFn>): Promise<QueryFnResult>;
export declare function waitForElement<Elem extends Element>(selector: string, options?: Partial<QueryOptions<Elem>>): Promise<Elem>;
export declare function waitForElement<Elem extends Element>(selector: string, parent: ParentNode, options?: Partial<QueryOptions<Elem>>): Promise<Elem>;
export declare function waitForElement<T extends keyof HTMLElementTagNameMap>(selector: T, options?: Partial<QueryOptions<HTMLElementTagNameMap[T]>>): Promise<HTMLElementTagNameMap[T]>;
export declare function waitForElement<T extends keyof HTMLElementTagNameMap>(selector: T, parent: ParentNode, options?: Partial<QueryOptions<HTMLElementTagNameMap[T]>>): Promise<HTMLElementTagNameMap[T]>;
export declare function waitForElementAll<Elem extends Element>(selector: string, options?: Partial<QueryOptions<NodeListOf<Elem>>>): Promise<Elem[]>;
export declare function waitForElementAll<Elems extends Element[]>(selector: string, options?: Partial<QueryOptions<NodeListOf<Element>>>): Promise<Elems>;
export declare function waitForElementParent<Elem extends Element>(parent: ParentNode, selector: string, options?: Partial<QueryOptions<Elem>>): Promise<Elem>;
export declare function waitForElementId<Elem extends Element>(id: string, options?: Partial<QueryOptions<Elem>>): Promise<Elem>;
export declare function waitForElementInf<Elem extends Element>(selector: string, options?: Partial<QueryOptions<Elem>>): Promise<Elem>;
