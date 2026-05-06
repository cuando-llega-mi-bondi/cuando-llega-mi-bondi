"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Stop } from "@/lib/static/stops";

const RENDER_LIMIT = 200;

export function ParadaList({
    paradas,
    label,
}: {
    paradas: Stop[];
    label: string;
}) {
    const [q, setQ] = useState("");

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();
        if (!query) return paradas;
        return paradas.filter((s) => s.nombre.toLowerCase().includes(query));
    }, [paradas, q]);

    return (
        <div>
            <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
                {label}
            </p>

            <div
                className="mb-3 flex items-center gap-2 rounded-xl border border-[#E8E2D2] bg-white px-3 py-2 focus-within:border-[#0099FF]"
            >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-[#6B7080]">
                    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                    <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Filtrar por calle"
                    className="flex-1 bg-transparent font-display text-[14px] text-[#0F1115] outline-none placeholder:text-[#6B7080]/70"
                />
                {q ? (
                    <button
                        type="button"
                        onClick={() => setQ("")}
                        className="grid h-6 w-6 place-items-center rounded-full bg-[#FAF7F0] text-[#6B7080] hover:bg-[#0F1115] hover:text-white"
                        aria-label="Limpiar"
                    >
                        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                ) : null}
                <span className="font-mono text-[10.5px] text-[#6B7080]">
                    {filtered.length}
                </span>
            </div>

            {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#E8E2D2] bg-white/50 p-5 text-center">
                    <p className="font-display text-[14px] font-semibold text-[#0F1115]">
                        Sin resultados
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-[#6B7080]">
                        Probá con otra calle.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-[#E8E2D2] bg-white v2-card-shadow">
                    {filtered.slice(0, RENDER_LIMIT).map((stop) => (
                        <Link
                            key={stop.id}
                            href={`/v2/parada/${encodeURIComponent(stop.id)}`}
                            className="flex w-full items-center gap-3 border-b border-[#F1ECDD] px-4 py-3 text-left last:border-b-0 hover:bg-[#FAF7F0]"
                        >
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0099FF] text-white">
                                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                                    <path
                                        d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-display text-[14px] font-semibold text-[#0F1115]">
                                    {stop.nombre}
                                </p>
                                <p className="truncate font-mono text-[10.5px] text-[#6B7080]">
                                    {stop.lineas.length}{" "}
                                    {stop.lineas.length === 1 ? "línea" : "líneas"}
                                </p>
                            </div>
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[#6B7080]">
                                <path
                                    d="m9 6 6 6-6 6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </Link>
                    ))}
                    {filtered.length > RENDER_LIMIT ? (
                        <div className="border-t border-[#F1ECDD] bg-[#FAF7F0] px-4 py-3 text-center font-mono text-[10.5px] text-[#6B7080]">
                            +{filtered.length - RENDER_LIMIT} paradas más
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
