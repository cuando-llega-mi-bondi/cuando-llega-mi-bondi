export function cleanLabel(label: string): string {
    if (!label) return "";
    return label
        .replace(/ - MAR DEL PLATA$/, "")
        .replace(/ - BARRIO .+$/, "");
}

export function cn(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(" ");
}

const FECHA_LARGA = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" });

export function formatFechaEs(iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? "" : FECHA_LARGA.format(date);
}
