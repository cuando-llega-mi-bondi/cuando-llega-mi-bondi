"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";

type LineaChip = { codigoLineaParada: string; descripcion: string };

type Item = {
    identificador: string;
    distanciaMetros: number;
    abreviaturaBandera: string | null;
    calleLabel: string | null;
    interseccionLabel: string | null;
    lineas: LineaChip[];
};

function formatEsquina(it: Item): string | null {
    const calle = it.calleLabel?.trim();
    const inter = it.interseccionLabel?.trim();
    if (calle && inter) return `${calle} y ${inter}`;
    if (calle) return calle;
    if (inter) return inter;
    return null;
}

function formatDist(m: number): string {
    if (m < 1000) return `${m} m`;
    return `${(m / 1000).toFixed(1)} km`;
}

type NearStopsSheetProps = {
    open: boolean;
    onClose: () => void;
    onPickLinea: (paradaId: string, codLinea: string) => void;
};

export function NearStopsSheet({ open, onClose, onPickLinea }: NearStopsSheetProps) {
    const [phase, setPhase] = useState<"idle" | "need-permission" | "loading" | "error" | "empty" | "ok">(
        "idle",
    );
    const [errorMsg, setErrorMsg] = useState("");
    const [radioMetros, setRadioMetros] = useState(600);
    const [items, setItems] = useState<Item[]>([]);

    const fetchNearby = useCallback((lat: number, lng: number) => {
        setPhase("loading");
        setErrorMsg("");
        const radio = 600;
        void (async () => {
            try {
                const res = await fetch(
                    `/api/geo/paradas-cercanas?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}&radio=${radio}`,
                );
                const data = (await res.json()) as { items?: Item[]; error?: string; radioMetros?: number };
                if (!res.ok) {
                    setPhase("error");
                    setErrorMsg(data.error ?? "No se pudo buscar");
                    return;
                }
                if (typeof data.radioMetros === "number") setRadioMetros(data.radioMetros);
                const list = data.items ?? [];
                if (list.length === 0) {
                    setItems([]);
                    setPhase("empty");
                } else {
                    setItems(list);
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
            (pos) => {
                fetchNearby(pos.coords.latitude, pos.coords.longitude);
            },
            () => {
                setPhase("error");
                setErrorMsg("No pudimos obtener tu ubicación. Revisá que el GPS esté activado.");
            },
            { enableHighAccuracy: true, timeout: 20_000, maximumAge: 60_000 },
        );
    }, [fetchNearby]);

    useEffect(() => {
        if (!open) {
            setPhase("idle");
            setItems([]);
            setErrorMsg("");
            return;
        }
        if (!navigator.geolocation) {
            setPhase("error");
            setErrorMsg("Tu navegador no soporta geolocalización");
            return;
        }
        setPhase("loading");
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
    }, [open, requestLocation]);

    return (
        <Modal open={open} onClose={onClose} className="max-w-lg max-h-[88dvh] flex flex-col overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="text-sm font-black tracking-wide">PARADAS CERCA MÍO</h2>
                <div className="flex gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={requestLocation}
                        disabled={phase === "loading"}
                    >
                        Actualizar
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                        Cerrar
                    </Button>
                </div>
            </div>

            <div className="min-h-[200px] flex-1 overflow-y-auto p-4">
                {phase === "need-permission" ? (
                    <div className="flex flex-col items-center gap-4 py-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Para mostrarte paradas cerca tuyo necesitamos acceder a tu ubicación. No la guardamos ni
                            la compartimos.
                        </p>
                        <Button type="button" variant="primary" onClick={requestLocation}>
                            Permitir ubicación
                        </Button>
                    </div>
                ) : null}

                {phase === "loading" ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16">
                        <Spinner />
                        <p className="text-sm text-muted-foreground">Buscando paradas cerca tuyo…</p>
                    </div>
                ) : null}

                {phase === "error" ? (
                    <div className="flex flex-col items-center gap-4 py-8 text-center">
                        <p className="text-sm text-destructive">{errorMsg}</p>
                        <Button type="button" variant="primary" onClick={requestLocation}>
                            Reintentar
                        </Button>
                    </div>
                ) : null}

                {phase === "empty" ? (
                    <div className="py-8 text-center">
                        <p className="font-bold">No hay paradas cerca</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            No encontramos paradas en un radio de {radioMetros} m. Probá moverte o reintentar.
                        </p>
                    </div>
                ) : null}

                {phase === "ok"
                    ? items.map((it) => {
                          const title =
                              formatEsquina(it) ?? it.abreviaturaBandera ?? `Parada ${it.identificador}`;
                          return (
                              <div
                                  key={it.identificador}
                                  className="mb-3 rounded-xl border border-border bg-card p-3 last:mb-0"
                              >
                                  <div className="flex items-start gap-2">
                                      <div className="min-w-0 flex-1">
                                          <p className="text-sm font-bold leading-snug">{title}</p>
                                      </div>
                                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                                          {formatDist(it.distanciaMetros)}
                                      </span>
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                      {it.lineas.map((ln) => (
                                          <button
                                              key={`${it.identificador}-${ln.codigoLineaParada}`}
                                              type="button"
                                              className={cn(
                                                  "rounded-lg bg-primary/15 px-2.5 py-1.5 text-xs font-bold",
                                                  "text-primary hover:bg-primary/25 transition-colors",
                                                  "min-h-[44px] min-w-[44px]",
                                              )}
                                              onClick={() => {
                                                  onPickLinea(it.identificador, ln.codigoLineaParada);
                                                  onClose();
                                              }}
                                          >
                                              {ln.descripcion?.trim() || ln.codigoLineaParada}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          );
                      })
                    : null}
            </div>
        </Modal>
    );
}
