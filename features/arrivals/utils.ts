import type { Arribo } from "./types";

export function arriboLineaDescripcion(a: Arribo): string {
    return (a.DescripcionLinea ?? a.descripcionLinea ?? "").trim();
}

export function arriboBanderaLabel(a: Arribo): string {
    for (const v of [
        a.DescripcionCartelBandera,
        a.descripcionCartelBandera,
        a.DescripcionBandera,
        a.descripcionBandera,
        a.DescripcionCortaBandera,
        a.descripcionCortaBandera,
    ]) {
        if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
}

export function getArriboColor(arribo: string): string {
    const lower = arribo.toLowerCase();
    if (lower.includes("llegando") || lower.includes("arribando")) return "#22c55e";
    const mins = parseInt(lower.match(/(\d+)\s*min/)?.[1] ?? "", 10);
    if (!isNaN(mins)) {
        if (mins <= 1) return "#22c55e";
        if (mins <= 3) return "#0099ff";
    }
    return "#ffffff";
}

export function formatDesvio(
    d: string,
): { label: string; color: string; isEarly: boolean } | null {
    if (!d || d === "+00:00" || d === "-00:00" || d === "00:00") return null;

    const isEarly = d.startsWith("-");
    const parts = d.replace(/[+-]/, "").split(":");
    let mins = 0;

    if (parts.length === 2) {
        mins = parseInt(parts[0]);
    } else if (parts.length === 3) {
        mins = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    if (isNaN(mins) || mins === 0) return null;
    return {
        label: `${mins} min`,
        color: isEarly ? "#22c55e" : "#ef4444",
        isEarly,
    };
}
