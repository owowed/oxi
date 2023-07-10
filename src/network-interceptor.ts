
import { Matcher, urlMatches, headersMatches } from "./network";

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

export interface InterceptedResponse extends Response {}

export type RuleTypeMap = {
    request: RequestRule;
    response: ResponseRule;
};

export type Rule = RequestRule | ResponseRule;

function fetchInterceptorFactory(interceptor: NetworkInterceptor, windowFetch: typeof window.fetch) {
    return async function fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const request = new Request(input, init);
        const interceptedRequest = interceptor.interceptRequest(request);

        if (interceptedRequest.blocked) {
            const responseError = Response.error();
            return responseError;
        }
        else {
            return windowFetch(interceptedRequest).then(res => {
                const interceptedResponse = interceptor.interceptResponse(res);
                return interceptedResponse;
            });
        }
    }
}

function xmlHttpRequestInterceptorFactory(interceptor: NetworkInterceptor, windowXmlHttpRequest: typeof window.XMLHttpRequest) {
    class XMLHttpRequest extends windowXmlHttpRequest {
        #headers = new Headers;

        constructor () {
            super();
            this.addEventListener("load", () => {
                const options: ResponseInit = {
                    status: this.status,
                    statusText: this.statusText,
                    headers: this.#headers,
                };
            });
        }

        setRequestHeader(name: string, value: string): void {
            this.#headers.set(name, value);
            super.setRequestHeader(name, value);
        }
    }
    return windowXmlHttpRequest;
}

export interface NetworkInterceptorOptions {
    global: Record<string, any>;
    fetchKey: string;
    xmlHttpRequestKey: string;
}

export class NetworkInterceptor {
    #requestRules: Required<RequestRule>[] = [];
    #responseRules: Required<ResponseRule>[] = [];
    #windowFetch: typeof window.fetch;
    #patchedFetch: typeof window.fetch;
    #windowXmlHttpRequest: typeof window.XMLHttpRequest;
    #patchedXmlHttpRequest: typeof window.XMLHttpRequest;

    get windowFetch() {
        return this.#windowFetch;
    }

    get patchedFetch() {
        return this.#patchedFetch;
    }

    constructor ({ global = globalThis, fetchKey = "fetch", xmlHttpRequestKey = "XMLHttpRequest" }: Partial<NetworkInterceptorOptions> = {}) {
        this.#windowFetch = global[fetchKey];
        this.#patchedFetch = global[fetchKey] = fetchInterceptorFactory(this, this.#windowFetch);
        this.#windowXmlHttpRequest = global[xmlHttpRequestKey];
        this.#patchedXmlHttpRequest = global[xmlHttpRequestKey] /* = xmlHttpRequestInterceptorFactory(this, this.#windowXmlHttpRequest) */;
    }

    interceptRequest(request: Request): InterceptedRequest {
        let interceptedRequest = request as InterceptedRequest;
        interceptedRequest.blocked = false;

        for (const rule of this.#requestRules) {
            const filterPass = urlMatches(rule.url, interceptedRequest.url) && headersMatches(rule.headers, interceptedRequest.headers);

            if (!filterPass) continue;

            if (rule.block) {
                interceptedRequest.blocked = true;
                break;
            }

            if (rule.redirect) {
                interceptedRequest = new Request(rule.redirect, interceptedRequest) as InterceptedRequest;
                interceptedRequest.blocked = false;
            }

            rule.callback(interceptedRequest);

            if (interceptedRequest.blocked) {
                break;
            }
        }

        return interceptedRequest;
    }

    interceptResponse(response: Response): InterceptedResponse {
        const interceptedResponse = response as InterceptedResponse;

        for (const rule of this.#responseRules) {
            const filterPass = urlMatches(rule.url, interceptedResponse.url) && headersMatches(rule.headers, interceptedResponse.headers);

            if (!filterPass) continue;

            rule.callback(interceptedResponse);
        }

        return interceptedResponse;
    }

    addRule(rule: RequestRule | ResponseRule): Readonly<Rule>;
    addRule<T extends keyof RuleTypeMap>
        (type: T, url: Matcher, callback: RuleTypeMap[T]["callback"], rule?: Omit<RuleTypeMap[T], "url" | "callback">): Readonly<Rule>;
    addRule
        (type: string, url: Matcher, callback: (resource: InterceptedRequest | InterceptedResponse) => void, rule?: Omit<Rule, "url" | "callback">): Readonly<Rule>;
    addRule(arg0: any, arg1?: any, arg2?: any, arg3?: any): Readonly<Rule> {
        let rule: Rule;

        if (arg0.constructor == Object) {
            rule = arg0;

            if (!rule.type) {
                throw new TypeError("missing type option");
            }
    
            if (!rule.callback) {
                throw new TypeError("missing callback option");
            }
        }
        else {
            const type: string = arg0;
            const url: Matcher = arg1;
            const callback: Function = arg2;

            rule = {
                type, url, callback,
                ...arg3
            } satisfies Rule;
        }

        rule.headers ??= {};

        if (rule.type == "request") {
            this.#requestRules.push(rule as Required<RequestRule>);
        }
        else if (rule.type == "response") {
            this.#responseRules.push(rule as Required<ResponseRule>);
        }

        return rule;
    }

    removeRule(rule: Rule) {
        if (rule.type == "request") {
            const ruleIndex = this.#requestRules.findIndex(r => r == rule);
            this.#requestRules.splice(ruleIndex, 1);
        }
        else {
            const ruleIndex = this.#responseRules.findIndex(r => r == rule);
            this.#responseRules.splice(ruleIndex, 1);
        }
    }

    clearRules() {
        this.#requestRules.length = 0;
        this.#responseRules.length = 0;
    }

    patchFetch(): void {
        window.fetch = this.#patchedFetch;
    }

    restoreFetch(): void {
        window.fetch = this.#windowFetch;
    }
}