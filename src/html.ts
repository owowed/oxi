

export const HTMLEntityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
} as const;

export function escapeHTML(text: string) {
    return text.replace(/[&<>"'`=\/]/g, (s) => HTMLEntityMap[s as keyof typeof HTMLEntityMap]);
}
  
export function html<Elem extends Element>(template: readonly string[], ...subst: any[]): Elem {
    const completeString = [];

    for (let i = 0; i < template.length; i++) {
        completeString.push(template[i]);
        if (subst[i]) completeString.push(escapeHTML(String(subst[i])));
    }

    return fromHTML<Elem>(completeString.join(""));
}

export function fromHTML<Elem extends Element>(text: string): Elem {
    const elem = document.createElement("div");
    elem.innerHTML = text;
    setTimeout(() => elem.remove());
    return elem.children[0] as Elem;
}