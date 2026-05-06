"use client";

import { useEffect, useState } from "react";

export const MDP_CENTER = { lat: -38.0023, lng: -57.5575 };

type GeoState =
    | { status: "idle" }
    | { status: "requesting" }
    | { status: "granted"; coords: { lat: number; lng: number }; accuracyMts: number }
    | { status: "denied" }
    | { status: "unavailable"; reason: string };

export function useGeolocation(): GeoState {
    const [state, setState] = useState<GeoState>({ status: "idle" });

    useEffect(() => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            setState({ status: "unavailable", reason: "Geolocation no soportada" });
            return;
        }

        let cancelled = false;
        let watchId: number | null = null;
        let perm: PermissionStatus | null = null;

        const startWatch = () => {
            if (cancelled || watchId != null) return;
            setState({ status: "requesting" });
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    if (cancelled) return;
                    setState({
                        status: "granted",
                        coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                        accuracyMts: Math.round(pos.coords.accuracy),
                    });
                },
                (err) => {
                    if (cancelled) return;
                    if (err.code === err.PERMISSION_DENIED) {
                        setState({ status: "denied" });
                    } else {
                        setState({ status: "unavailable", reason: err.message });
                    }
                },
                { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 },
            );
        };

        const stopWatch = () => {
            if (watchId != null) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }
        };

        const onPermChange = () => {
            if (!perm || cancelled) return;
            if (perm.state === "granted" || perm.state === "prompt") {
                stopWatch();
                startWatch();
            } else if (perm.state === "denied") {
                stopWatch();
                setState({ status: "denied" });
            }
        };

        // Suscribirse a cambios de permiso si el browser lo soporta (Permissions API)
        if (typeof navigator.permissions?.query === "function") {
            navigator.permissions
                .query({ name: "geolocation" as PermissionName })
                .then((result) => {
                    if (cancelled) return;
                    perm = result;
                    perm.addEventListener("change", onPermChange);
                    startWatch();
                })
                .catch(() => {
                    if (!cancelled) startWatch();
                });
        } else {
            startWatch();
        }

        return () => {
            cancelled = true;
            stopWatch();
            if (perm) perm.removeEventListener("change", onPermChange);
        };
    }, []);

    return state;
}

export function geoCenter(state: GeoState): { lat: number; lng: number } {
    return state.status === "granted" ? state.coords : MDP_CENTER;
}
