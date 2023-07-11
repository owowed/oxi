import { Matcher } from "./network";
export interface RequestRule {
    type: "request";
    url: Matcher;
    headers?: Record<string, Matcher>;
    block?: boolean;
    redirect?: URL | string | false;
    callback: (request: InterceptedRequest) => void;
}
export interface ResponseRule {
    type: "response";
    url: Matcher;
    headers?: Record<string, Matcher>;
    callback: (response: InterceptedResponse) => void;
}
export interface InterceptedRequest extends Request {
    blocked: boolean;
}
export interface InterceptedResponse extends Response {
}
export type RuleMap = {
    request: RequestRule;
    response: ResponseRule;
};
export type Rule = RequestRule | ResponseRule;
export interface NetworkInterceptorOptions {
    global: Record<string, any>;
    fetchKey: string;
    xmlHttpRequestKey: string;
}
export declare class NetworkInterceptor {
    #private;
    get windowFetch(): ((input: URL | RequestInfo, init?: RequestInit | undefined) => Promise<Response>) & typeof fetch;
    get patchedFetch(): ((input: URL | RequestInfo, init?: RequestInit | undefined) => Promise<Response>) & typeof fetch;
    constructor({ global, fetchKey, xmlHttpRequestKey }?: Partial<NetworkInterceptorOptions>);
    interceptRequest(request: Request): InterceptedRequest;
    interceptResponse(response: Response): InterceptedResponse;
    addRule(rule: RequestRule | ResponseRule): Readonly<Rule>;
    addRule<T extends keyof RuleMap>(type: T, url: Matcher, callback: RuleMap[T]["callback"], rule?: Omit<RuleMap[T], "url" | "callback">): Readonly<Rule>;
    addRule(type: string, url: Matcher, callback: (resource: InterceptedRequest | InterceptedResponse) => void, rule?: Omit<Rule, "url" | "callback">): Readonly<Rule>;
    removeRule(rule: Rule): void;
    clearRules(): void;
    patchFetch(): void;
    restoreFetch(): void;
}
