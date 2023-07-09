export declare class WaitForElementTimeoutError extends Error {
    name: string;
    constructor(ms: number);
}
export declare class WaitForElementMaxTriesError extends Error {
    name: string;
    constructor(maxTries: number);
}
export declare class WaitForElementMissingOptionError extends Error {
    name: string;
}
