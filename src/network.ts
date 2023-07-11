
import normalizeUrl from 'normalize-url';

export type Matcher = string | RegExp | URL | true;

export function urlMatches(matcher: Matcher, url?: string) {
    let result = false;

    if (url == null) return false;
    if (matcher === true) return true;
    
    url = normalizeUrl(url);

    if (matcher instanceof URL) {
        result = normalizeUrl(matcher.href) == url;
    }
    if (typeof matcher == "string") {
        result = normalizeUrl(matcher) == url;
    }
    if (matcher instanceof RegExp) {
        result = matcher.test(url);
    }

    return result;
}

export function headersMatches(headerMatchers: Record<string, Matcher>, headers: Headers) {
    let result = false;

    const headerMatchersKeys = Object.keys(headerMatchers);

    if (headerMatchersKeys.length == 0) return true;

    for (const key of Object.keys(headerMatchers)) {
        const matcher = headerMatchers[key];
        const headerValue = headers.get(key);
        
        if (headerValue == null) return false;
        if (matcher === true) return true;

        if (matcher instanceof URL) {
            result = normalizeUrl(matcher.href) == normalizeUrl(headerValue);
        }
        else if (matcher instanceof RegExp) {
            result = matcher.test(headerValue);
        }
        else {
            result = String(matcher) == headerValue;
        }

        if (!result) return false;
    }

    return result;
}