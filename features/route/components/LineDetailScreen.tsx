"use client";

import { ReviewsPanel } from "@features/reviews/components/ReviewsPanel";
import { describeMgpError } from "@shared/api/errors";
import { BottomNav } from "@shared/layout/BottomNav";
import { Button } from "@shared/ui/Button";
import { Spinner } from "@shared/ui/Spinner";
import type { Linea } from "@shared/types";
import type { RamalData } from "@features/route/types";
import { lineaNumero } from "@features/route/lineaNumero";

const IconBack = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
    </svg>
);
const IconMapPin = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
    </svg>
);

interface LineDetailScreenProps {
    line: Linea;
    ramales: RamalData[];
    loading: boolean;
    error: unknown;
    onBack: () => void;
    onViewMap: () => void;
    onRetry: () => void;
}

export function LineDetailScreen({
    line,
    ramales,
    loading,
    error,
    onBack,
    onViewMap,
    onRetry,
}: LineDetailScreenProps) {
    return (
        <div className="flex min-h-pwa-shell flex-col bg-background pb-nav lg:pl-60">
            <div className="relative h-56 shrink-0 overflow-hidden bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/route/linea-hero-placeholder.png"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-black/10 to-black/35" />
                <button
                    type="button"
                    onClick={onBack}
                    className="absolute left-[calc(16px+var(--safe-left))] top-[calc(16px+var(--safe-top))] flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                    title="Volver"
                >
                    <IconBack />
                </button>
            </div>

            <div className="flex-1 px-4 pb-8 pt-4 lg:px-8 lg:pt-6">
                <div className="flex items-center gap-2.5">
                    <span className="shrink-0 rounded-full border border-secondary/45 bg-secondary/12 px-3 py-1 font-display text-lg font-semibold tracking-[-0.03em] text-secondary">
                        {lineaNumero(line)}
                    </span>
                    <h1 className="min-w-0 truncate font-sans text-lg font-semibold tracking-[-0.02em] text-foreground">
                        {line.Descripcion}
                    </h1>
                </div>

                {loading ? (
                    <div className="mt-3 flex items-center gap-2 font-sans text-[13px] text-muted-foreground">
                        <Spinner className="h-4 w-4 border-2" />
                        Cargando recorrido…
                    </div>
                ) : error ? (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted px-3.5 py-2.5">
                        <p className="font-sans text-[13px] text-muted-foreground">
                            {describeMgpError(error).message}
                        </p>
                        <button
                            type="button"
                            onClick={onRetry}
                            className="shrink-0 font-sans text-[13px] font-medium text-secondary underline-offset-2 hover:underline"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : ramales.length > 0 ? (
                    <div className="-mx-4 mt-3 overflow-x-auto px-4 [scrollbar-width:none] lg:-mx-8 lg:px-8">
                        <div className="flex w-max gap-2">
                            {ramales.map((ramal) => (
                                <span
                                    key={ramal.key}
                                    className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-muted px-3.5 py-[7px] font-sans text-[13px] font-medium tracking-[-0.01em] text-muted-foreground"
                                >
                                    <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/35" />
                                    {ramal.label}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : null}

                <Button variant="secondary" size="md" onClick={onViewMap} className="mt-4 w-full gap-2">
                    <IconMapPin />
                    Ver recorrido en mapa
                </Button>

                <div className="mt-6">
                    <p className="mb-2.5 font-sans text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Calificaciones
                    </p>
                    <ReviewsPanel lineaCodigo={line.CodigoLineaParada} lineaNombre={line.Descripcion} />
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
