export interface FormatStringOptions {
    subst: {
        format: string;
        var: string;
    };
}
export declare function escapeRegExp(text: string): string;
export declare function formatString(text: string, dict: Record<string, any>, { subst }?: Partial<FormatStringOptions>): string;
