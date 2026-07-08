import L from "leaflet";

export function createArrowIcon(bearing: number) {
    return L.divIcon({
        className: "clear-arrow",
        html: `<div style="transform: rotate(${bearing}deg); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.4));">
                <path d="M18 15l-6-6-6 6"/>
            </svg>
           </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });
}

export function envLocalSafeAreaBottom(fallback: number) {
    if (
        typeof window !== "undefined" &&
        window.CSS &&
        CSS.supports("padding-bottom: env(safe-area-inset-bottom)")
    ) {
        return "calc(env(safe-area-inset-bottom) + 16px)";
    }
    return fallback;
}

export function envLocalSafeAreaTop(fallback: number) {
    if (
        typeof window !== "undefined" &&
        window.CSS &&
        CSS.supports("padding-top: env(safe-area-inset-top)")
    ) {
        return "calc(env(safe-area-inset-top) + 16px)";
    }
    return fallback;
}
