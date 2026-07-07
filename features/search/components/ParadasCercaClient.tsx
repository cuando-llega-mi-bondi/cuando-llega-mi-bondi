"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@shared/ui/Button";
import { Spinner } from "@shared/ui/Spinner";
import { BottomNav } from "@shared/layout/BottomNav";
import { useSearchFlowStore } from "@features/search/store/useSearchFlowStore";
import { MANUAL_LINES } from "@features/route/manualRoutes";
import type { NearStop, NearUser } from "@features/search/components/NearStopsMap";

const MANUAL_LINE_CODES = new Set(MANUAL_LINES.map((l) => l.CodigoLineaParada));

// Leaflet no corre en el server — import dinámico con ssr:false obligatorio.
const NearStopsMap = dynamic(() => import("@features/search/components/NearStopsMap"), {
    ssr: false,
    loading: () => (
        <div className="flex h-full items-center justify-center gap-2.5 font-sans text-sm tracking-[-0.01em] text-muted-foreground">
            <Spinner />
            Cargando mapa…
        </div>
    ),
});

const IconBack = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
    </svg>
);

type Phase = "need-permission" | "loading" | "error" | "empty" | "ok";

type ApiResponse = {
    items?: NearStop[];
    error?: string;
    radioMetros?: number;
};

export function ParadasCercaClient() {
    const router = useRouter();
    const [phase, setPhase] = useState<Phase>("loading");
    const [errorMsg, setErrorMsg] = useState("");
    const [radioMetros, setRadioMetros] = useState(600);
    const [stops, setStops] = useState<NearStop[]>([]);
    const [user, setUser] = useState<NearUser | null>(null);

    const fetchNearby = useCallback((lat: number, lng: number) => {
        setPhase("loading");
        setErrorMsg("");
        const radio = 600;
        void (async () => {
            try {
                const res = await fetch(
                    `/api/geo/paradas-cercanas?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}&radio=${radio}`,
                );
                const data = (await res.json()) as ApiResponse;
                if (!res.ok) {
                    setPhase("error");
                    setErrorMsg(data.error ?? "No se pudo buscar");
                    return;
                }
                if (typeof data.radioMetros === "number") setRadioMetros(data.radioMetros);
                setUser({ lat, lng });
                const list = data.items ?? [];
                if (list.length === 0) {
                    setStops([]);
                    setPhase("empty");
                } else {
                    setStops(list);
                    setPhase("ok");
                }
            } catch {
                setPhase("error");
                setErrorMsg("Error de red");
            }
        })();
    }, []);

    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setPhase("error");
            setErrorMsg("Tu navegador no soporta geolocalización");
            return;
        }
        setPhase("loading");
        setErrorMsg("");
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude),
            () => {
                setPhase("error");
                setErrorMsg("No pudimos obtener tu ubicación. Revisá que el GPS esté activado.");
            },
            { enableHighAccuracy: true, timeout: 20_000, maximumAge: 60_000 },
        );
    }, [fetchNearby]);

    useEffect(() => {
        if (!navigator.geolocation) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPhase("error");
            setErrorMsg("Tu navegador no soporta geolocalización");
            return;
        }
        void navigator.permissions
            ?.query({ name: "geolocation" })
            .then((st) => {
                if (st.state === "denied") {
                    setPhase("need-permission");
                } else {
                    requestLocation();
                }
            })
            .catch(() => {
                requestLocation();
            });
    }, [requestLocation]);

    const handlePickLinea = useCallback(
        (paradaId: string, codLinea: string) => {
            // Las líneas manuales no tienen arribos en tiempo real → al recorrido.
            if (MANUAL_LINE_CODES.has(codLinea)) {
                router.push(`/recorrido?linea=${encodeURIComponent(codLinea)}`);
                return;
            }
            // Seteamos la selección directo en el store (patrón probado del flujo de
            // consulta) para no depender del timing de hidratación de la URL al cambiar
            // de ruta; los query params quedan para que un refresh/compartir funcione.
            useSearchFlowStore.getState().resetToParada(paradaId, codLinea, { consulting: true });
            router.push(
                `/consultar?linea=${encodeURIComponent(codLinea)}&parada=${encodeURIComponent(paradaId)}`,
            );
        },
        [router],
    );

    return (
        <div className="flex h-dvh flex-col bg-background pb-nav lg:pl-19 lg:pb-0">
            <header className="z-50 flex shrink-0 items-center gap-3 border-b border-border bg-background/90 px-[calc(16px+var(--safe-left))] pr-[calc(16px+var(--safe-right))] pt-[calc(10px+var(--safe-top))] pb-3 backdrop-blur-md lg:px-8">
                <Link
                    href="/consultar"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground no-underline transition hover:border-secondary hover:text-foreground"
                    title="Volver"
                >
                    <IconBack />
                </Link>
                <div className="min-w-0 flex-1">
                    <div className="truncate font-sans text-[15px] font-semibold tracking-[-0.02em] text-foreground">
                        Paradas cerca mío
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {phase === "ok"
                            ? `${stops.length} paradas en ${radioMetros} m`
                            : "Tu ubicación · tiempo real"}
                    </div>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={requestLocation}
                    disabled={phase === "loading"}
                    className="shrink-0"
                >
                    Actualizar
                </Button>
            </header>

            <div className="relative min-h-0 flex-1">
                {phase === "ok" && user ? (
                    <NearStopsMap
                        user={user}
                        stops={stops}
                        radioMetros={radioMetros}
                        onPickLinea={handlePickLinea}
                    />
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                        {phase === "loading" ? (
                            <>
                                <Spinner />
                                <p className="text-sm text-muted-foreground">Buscando paradas cerca tuyo…</p>
                            </>
                        ) : null}

                        {phase === "need-permission" ? (
                            <>
                                <p className="max-w-sm text-sm text-muted-foreground">
                                    Para mostrarte las paradas en el mapa necesitamos acceder a tu ubicación. No la
                                    guardamos ni la compartimos.
                                </p>
                                <Button type="button" variant="primary" onClick={requestLocation}>
                                    Permitir ubicación
                                </Button>
                            </>
                        ) : null}

                        {phase === "error" ? (
                            <>
                                <p className="text-sm text-destructive">{errorMsg}</p>
                                <Button type="button" variant="primary" onClick={requestLocation}>
                                    Reintentar
                                </Button>
                            </>
                        ) : null}

                        {phase === "empty" ? (
                            <>
                                <p className="font-bold text-foreground">No hay paradas cerca</p>
                                <p className="max-w-sm text-sm text-muted-foreground">
                                    No encontramos paradas en un radio de {radioMetros} m. Probá moverte o reintentar.
                                </p>
                                <Button type="button" variant="primary" onClick={requestLocation}>
                                    Reintentar
                                </Button>
                            </>
                        ) : null}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
