
export interface FormatStringOptions {
    subst: {
        format: string;
        var: string;
    }
}

export function escapeRegExp(text: string) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export function formatString(
        text: string,
        dict: Record<string, any>,
        { subst = { format: "${{ | }}", var: "|" } }: Partial<FormatStringOptions> = {}): string
{
    const substRegex = subst.format
        .split(subst.var)
        .map(escapeRegExp)
        .join(String.raw`([$\w\d-_.: ]+)`);
    return text.replace(new RegExp(substRegex, "g"), (_, varKey) => dict[varKey]?.toString());
}