
export class WaitForElementTimeoutError extends Error {
    name = this.constructor.name;

    constructor (ms: number) {
        super(`wait for element timeout for ${ms}ms`);
    }
}

export class WaitForElementMaxTriesError extends Error {
    name = this.constructor.name;

    constructor (maxTries: number) {
        super(`wait for element out of tries (max tries: ${maxTries})`);
    }
}

export class WaitForElementMissingOptionError extends Error {
    name = this.constructor.name;
}