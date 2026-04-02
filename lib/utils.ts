/**
 * Standard colors for arrival times
 */
export function getArriboColor(arribo: string): string {
    const lower = arribo.toLowerCase();
    if (lower.includes("1 min") || lower.includes("llegando")) return "#22c55e";
    if (lower.includes("2 min") || lower.includes("3 min")) return "#f5a623";
    return "#e8e8ec";
}

/**
 * Formats the deviation string (e.g., "-06:22" or "+02:15") into a readable label
 */
export function formatDesvio(d: string): { label: string; color: string; isEarly: boolean } | null {
    if (!d || d === "+00:00" || d === "-00:00" || d === "00:00") return null;
    
    const isEarly = d.startsWith("-");
    const parts = d.replace(/[+-]/, "").split(":");
    let mins = 0;
    
    if (parts.length === 2) {
        // MM:SS
        mins = parseInt(parts[0]);
    } else if (parts.length === 3) {
        // HH:MM:SS
        mins = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    if (isNaN(mins) || mins === 0) return null;
    return { 
        label: `${mins} min`, 
        color: isEarly ? "#22c55e" : "#ef4444", 
        isEarly 
    };
}

/**
 * Cleans up street/intersection labels by removing redundant city/neighborhood suffixes
 */
export function cleanLabel(label: string): string {
    if (!label) return "";
    return label
        .replace(/ - MAR DEL PLATA$/, "")
        .replace(/ - BARRIO .+$/, "");
}
