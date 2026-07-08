export function cleanLabel(label: string): string {
    if (!label) return "";
    return label
        .replace(/ - MAR DEL PLATA$/, "")
        .replace(/ - BARRIO .+$/, "");
}

export function cn(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(" ");
}
