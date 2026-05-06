"use client";

import useSWR from "swr";
import { motion } from "motion/react";
import {
    getLineaArribos,
    getLineaEnVivo,
    type LiveBus,
    type MuniArribo,
} from "@/lib/bondi-api/lineas";

const REFRESH_MS = 20_000;
/** Cuando GPS y Muni difieren más de este % relativo, mostramos GPS como primario. */
const DIFFERENT_THRESHOLD = 0.3;

type LineaResult = {
    linea: string;
    buses: LiveBus[];
    muni: MuniArribo[];
    muniSource: "muni" | "muni_unavailable";
};

type Source = "gps" | "muni";
type MergedRow = {
    key: string;
    linea: string;
    ramal: string | null;
    primary: { source: Source; etaMin: number | null; label: string };
    secondary?: { source: Source; etaMin: number | null; label: string };
    extra?: string;
};

function mergeForLine(r: LineaResult): MergedRow[] {
    const rows: MergedRow[] = [];
    const usedMuniIdx = new Set<number>();

    // GPS primero — preferimos cuando hay user activo compartiendo viaje.
    r.buses.forEach((b, i) => {
        const muniMatchIdx = r.muni.findIndex(
            (m, mi) =>
                !usedMuniIdx.has(mi) &&
                ((m.ramal && b.ramal && m.ramal === b.ramal) ||
                    (b.etaMin !== null && m.etaMin !== null && Math.abs(b.etaMin - m.etaMin) < 6)),
        );
        const muniMatch = muniMatchIdx >= 0 ? r.muni[muniMatchIdx] : undefined;
        if (muniMatchIdx >= 0) usedMuniIdx.add(muniMatchIdx);

        const gpsLabel = b.etaMin !== null ? `${b.etaMin} min` : "—";

        let secondary: MergedRow["secondary"];
        if (muniMatch && b.etaMin !== null && muniMatch.etaMin !== null) {
            const denom = Math.max(b.etaMin, muniMatch.etaMin, 1);
            const diff = Math.abs(b.etaMin - muniMatch.etaMin) / denom;
            if (diff > DIFFERENT_THRESHOLD) {
                secondary = {
                    source: "muni",
                    etaMin: muniMatch.etaMin,
                    label: `${muniMatch.etaMin} min según muni`,
                };
            }
        }

        const speed = b.avgVelocityKmh ?? b.velocityKmh;
        const extraParts: string[] = [];
        if (speed !== null) extraParts.push(`${Math.round(speed)} km/h`);
        extraParts.push(`hace ${Math.max(0, b.ageSec)} s`);
        if (b.etaSource === "gps_fallback") extraParts.push("ETA estimado");

        rows.push({
            key: `gps-${r.linea}-${b.sessionId}`,
            linea: r.linea,
            ramal: b.ramal,
            primary: { source: "gps", etaMin: b.etaMin, label: gpsLabel },
            secondary,
            extra: extraParts.join(" · "),
        });
    });

    // Resto de muni (los que no matchearon ningún GPS).
    r.muni.forEach((m, i) => {
        if (usedMuniIdx.has(i)) return;
        rows.push({
            key: `muni-${r.linea}-${i}`,
            linea: r.linea,
            ramal: m.ramal,
            primary: {
                source: "muni",
                etaMin: m.etaMin,
                label: m.etaMin !== null ? `${m.etaMin} min` : m.etaText,
            },
        });
    });

    return rows;
}

export function LiveArrivals({
    paradaId,
    lineas,
}: {
    paradaId: string;
    lineas: string[];
}) {
    const { data, isLoading } = useSWR<LineaResult[]>(
        ["live-arrivals", paradaId, lineas.join(",")],
        async () => {
            const results = await Promise.all(
                lineas.map(async (linea): Promise<LineaResult> => {
                    const [gpsR, muniR] = await Promise.all([
                        getLineaEnVivo(linea, paradaId).catch(() => ({ buses: [] })),
                        getLineaArribos(linea, paradaId).catch(() => ({
                            source: "muni_unavailable" as const,
                            arribos: [],
                        })),
                    ]);
                    return {
                        linea,
                        buses: gpsR.buses,
                        muni: muniR.arribos,
                        muniSource: muniR.source,
                    };
                }),
            );
            return results;
        },
        {
            refreshInterval: REFRESH_MS,
            revalidateOnFocus: true,
            dedupingInterval: 5_000,
        },
    );

    const all = data ?? [];
    const rows = all.flatMap(mergeForLine).sort((a, b) => {
        const ax = a.primary.etaMin ?? 999;
        const bx = b.primary.etaMin ?? 999;
        return ax - bx;
    });

    const hasMuniDown =
        all.length > 0 && all.every((r) => r.muniSource === "muni_unavailable");

    if (isLoading && !data) return <Card kind="loading" />;

    if (rows.length === 0) {
        return <Card kind={hasMuniDown ? "muni_down" : "empty"} />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-[#E8E2D2] bg-white v2-card-shadow"
        >
            <div className="flex items-center justify-between gap-2 border-b border-[#F1ECDD] px-4 py-2.5">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
                    Próximos arribos
                </p>
                <span className="flex items-center gap-1 font-mono text-[10px] text-[#0099FF]">
                    <span className="relative inline-flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0099FF] opacity-60" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#0099FF]" />
                    </span>
                    en vivo
                </span>
            </div>
            <ul className="divide-y divide-[#F1ECDD]">
                {rows.map((row) => (
                    <Row key={row.key} row={row} />
                ))}
            </ul>
        </motion.div>
    );
}

function Row({ row }: { row: MergedRow }) {
    return (
        <li className="flex items-center gap-3 px-4 py-3">
            <span className="grid h-9 min-w-9 place-items-center rounded-lg bg-[#FFD60A] px-1.5 font-display text-[14px] font-bold text-[#0F1115]">
                {row.linea}
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <p className="truncate font-display text-[14px] font-semibold text-[#0F1115]">
                        {row.ramal ?? `Línea ${row.linea}`}
                    </p>
                    <SourceBadge source={row.primary.source} />
                </div>
                {row.extra ? (
                    <p className="font-mono text-[10.5px] text-[#6B7080]">{row.extra}</p>
                ) : null}
                {row.secondary ? (
                    <p className="font-mono text-[10.5px] text-[#6B7080]">
                        {row.secondary.label}
                    </p>
                ) : null}
            </div>
            <div className="text-right">
                {row.primary.etaMin !== null ? (
                    <p className="font-display text-[24px] font-semibold leading-none text-[#0F1115]">
                        {row.primary.etaMin}
                        <span className="ml-0.5 text-[11px] font-medium text-[#6B7080]">
                            min
                        </span>
                    </p>
                ) : (
                    <p className="font-mono text-[12px] text-[#6B7080]">
                        {row.primary.label}
                    </p>
                )}
            </div>
        </li>
    );
}

function SourceBadge({ source }: { source: Source }) {
    if (source === "gps") {
        return (
            <span className="rounded-md bg-[#E6F7EE] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#0F8F4F]">
                GPS
            </span>
        );
    }
    return (
        <span className="rounded-md bg-[#FFF6DB] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#8B6800]">
            Muni
        </span>
    );
}

function Card({ kind }: { kind: "loading" | "empty" | "muni_down" }) {
    return (
        <div className="rounded-2xl border border-dashed border-[#E8E2D2] bg-white/50 p-4 text-center">
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-[#6B7080]">
                Próximos arribos
            </p>
            <p className="mt-2 font-display text-[13.5px] text-[#6B7080]">
                {kind === "loading"
                    ? "Buscando bondis…"
                    : kind === "muni_down"
                      ? "La API municipal no responde y no hay GPS de usuarios. Probá en un rato."
                      : "No hay bondis próximos en estas líneas."}
            </p>
        </div>
    );
}
