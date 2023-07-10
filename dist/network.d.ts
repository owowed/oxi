export type Matcher = string | RegExp | URL | true;
export declare function urlMatches(matcher: Matcher, url?: string): boolean;
export declare function headersMatches(headerMatchers: Record<string, Matcher>, headers: Headers): boolean;
