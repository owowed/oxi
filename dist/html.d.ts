export declare const HTMLEntityMap: {
    readonly '&': "&amp;";
    readonly '<': "&lt;";
    readonly '>': "&gt;";
    readonly '"': "&quot;";
    readonly "'": "&#39;";
    readonly '/': "&#x2F;";
    readonly '`': "&#x60;";
    readonly '=': "&#x3D;";
};
export declare function escapeHTML(text: string): string;
export declare function html<Elem extends Element>(template: readonly string[], ...subst: any[]): Elem;
export declare function fromHTML<Elem extends Element>(text: string): Elem;
