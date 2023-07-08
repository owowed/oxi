export type QueryOptions<QueryFnResult, QueryFn extends (selector: string) => QueryFnResult | null = (selector: string) => QueryFnResult | null> = ({
    id: string;
} | {
    selector: string;
}) & {
    parent?: ParentNode;
    querySelector?: QueryFn;
    abortSignal?: AbortSignal;
    timeout?: number | false;
    maxTries?: number;
    ensureDomContentLoaded?: boolean;
    observerOptions?: MutationObserverInit;
};
export declare function executeQuery<QueryFnResult, QueryFn extends (selector: string) => QueryFnResult | null = (selector: string) => QueryFnResult | null>(options: QueryOptions<QueryFnResult, QueryFn>): Promise<QueryFnResult>;
export declare function waitForElement<Elem extends Element>(selector: string, options: QueryOptions<Elem>): Promise<Elem>;
export declare function waitForElementAll(selector: string, options: QueryOptions<NodeListOf<Element>>): Promise<Element[]>;
export declare function waitForElementParent<Elem extends Element>(parent: ParentNode, selector: string, options: QueryOptions<Elem>): Promise<Elem>;
export declare function waitForElementId<Elem extends Element>(id: string, options: QueryOptions<Elem>): Promise<Elem>;
export declare function waitForElementInf<Elem extends Element>(selector: string, options: QueryOptions<Elem>): Promise<Elem>;
