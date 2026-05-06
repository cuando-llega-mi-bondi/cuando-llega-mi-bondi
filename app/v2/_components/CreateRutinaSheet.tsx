"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { useRutinas } from "@/lib/bondi-api/hooks";
import { STOPS, type Stop } from "@/lib/static/stops";
import type { CreateRutinaInput } from "@/lib/bondi-api/types";

const DOWS_LABELS = ["L", "M", "M", "J", "V", "S", "D"]; // ISO 1..7

type Tab = "arrival" | "daily";

export function CreateRutinaSheet({ onClose }: { onClose: () => void }) {
    const { create } = useRutinas();
    const [tab, setTab] = useState<Tab>("arrival");
    const [nombre, setNombre] = useState("");
    const [dows, setDows] = useState<number[]>([1, 2, 3, 4, 5]);
    const [stopQuery, setStopQuery] = useState("");
    const [stopId, setStopId] = useState("");
    const [linea, setLinea] = useState("");
    const [threshold, setThreshold] = useState(5);
    const [fireAt, setFireAt] = useState("08:00");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const stopById = useMemo(() => new Map(STOPS.map((s) => [s.id, s])), []);
    const stop = stopId ? stopById.get(stopId) : undefined;
    const candidates = useMemo<Stop[]>(() => {
        const q = stopQuery.trim().toLowerCase();
        if (!q) return [];
        return STOPS.filter((s) => s.nombre.toLowerCase().includes(q)).slice(0, 6);
    }, [stopQuery]);

    function toggleDow(d: number) {
        setDows((prev) =>
            prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
        );
    }

    async function onSubmit() {
        if (!nombre.trim() || submitting) return;
        const dowsToSend = dows.length === 7 ? null : dows;
        let payload: CreateRutinaInput;
        if (tab === "arrival") {
            if (!stop || !linea.trim()) {
                setError("Falta parada o línea.");
                return;
            }
            payload = {
                kind: "arrival_watch",
                nombre: nombre.trim(),
                parada_id: stop.id,
                linea_id: linea.trim(),
                threshold_min: threshold,
                active_dows: dowsToSend,
            };
        } else {
            payload = {
                kind: "daily_reminder",
                nombre: nombre.trim(),
                fire_at: fireAt,
                active_dows: dowsToSend,
            };
        }
        setSubmitting(true);
        setError(null);
        try {
            await create(payload);
            onClose();
        } catch {
            setError("No se pudo crear. Probá de nuevo.");
            setSubmitting(false);
        }
    }

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center">
            <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="flex w-full max-w-md flex-col gap-4 rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)] shadow-2xl sm:rounded-3xl sm:pb-6"
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
                            Nueva rutina
                        </p>
                        <h2 className="mt-1 font-display text-[20px] font-semibold leading-tight text-[#0F1115]">
                            Push automático
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="grid h-8 w-8 place-items-center rounded-full bg-[#FAF7F0] text-[#6B7080]"
                        aria-label="Cerrar"
                    >
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                            <path
                                d="m6 6 12 12M18 6 6 18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[#FAF7F0] p-1">
                    <button
                        type="button"
                        onClick={() => setTab("arrival")}
                        className={`rounded-xl py-2.5 font-display text-[13px] font-semibold transition ${
                            tab === "arrival"
                                ? "bg-white text-[#0F1115] shadow-sm"
                                : "text-[#6B7080]"
                        }`}
                    >
                        Aviso de bondi
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("daily")}
                        className={`rounded-xl py-2.5 font-display text-[13px] font-semibold transition ${
                            tab === "daily"
                                ? "bg-white text-[#0F1115] shadow-sm"
                                : "text-[#6B7080]"
                        }`}
                    >
                        Recordatorio
                    </button>
                </div>

                {/* Nombre */}
                <label className="block">
                    <span className="mb-1 block font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
                        Nombre
                    </span>
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder={
                            tab === "arrival" ? "Ej. Bondi a casa" : "Ej. Salgo a laburar"
                        }
                        maxLength={120}
                        className="w-full rounded-xl border border-[#E8E2D2] bg-[#FAF7F0] px-3 py-3 font-display text-[15px] outline-none focus:border-[#0099FF] focus:bg-white"
                    />
                </label>

                {tab === "arrival" ? (
                    <>
                        {/* Parada */}
                        <div>
                            <span className="mb-1 block font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
                                Parada
                            </span>
                            {stop ? (
                                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E8E2D2] bg-[#FAF7F0] px-3 py-3">
                                    <p className="min-w-0 truncate font-display text-[14px] font-semibold text-[#0F1115]">
                                        {stop.nombre}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStopId("");
                                            setStopQuery("");
                                        }}
                                        className="font-mono text-[11px] uppercase tracking-wider text-[#0099FF]"
                                    >
                                        cambiar
                                    </button>
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    value={stopQuery}
                                    onChange={(e) => setStopQuery(e.target.value)}
                                    placeholder="Buscá por nombre…"
                                    className="w-full rounded-xl border border-[#E8E2D2] bg-[#FAF7F0] px-3 py-3 font-display text-[15px] outline-none focus:border-[#0099FF] focus:bg-white"
                                />
                            )}
                            {!stop && candidates.length > 0 ? (
                                <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-[#E8E2D2] bg-white">
                                    {candidates.map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => {
                                                setStopId(s.id);
                                                setStopQuery("");
                                                if (s.lineas[0] && !linea) setLinea(s.lineas[0]);
                                            }}
                                            className="block w-full border-b border-[#F1ECDD] px-3 py-2 text-left font-display text-[13.5px] last:border-b-0 hover:bg-[#FAF7F0]"
                                        >
                                            <p className="truncate">{s.nombre}</p>
                                            <p className="font-mono text-[10.5px] text-[#6B7080]">
                                                {s.lineas.slice(0, 4).join(" · ")}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        {/* Línea */}
                        {stop ? (
                            <div>
                                <span className="mb-1 block font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
                                    Línea
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {stop.lineas.map((l) => (
                                        <button
                                            key={l}
                                            type="button"
                                            onClick={() => setLinea(l)}
                                            className={`grid min-w-10 place-items-center rounded-lg px-2 py-1.5 font-display text-[13px] font-bold transition ${
                                                linea === l
                                                    ? "bg-[#0099FF] text-white"
                                                    : "bg-[#FFD60A] text-[#0F1115]"
                                            }`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {/* Threshold */}
                        <label className="block">
                            <span className="mb-1 block font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
                                Avisar cuando esté a {threshold} min o menos
                            </span>
                            <input
                                type="range"
                                min={1}
                                max={20}
                                value={threshold}
                                onChange={(e) => setThreshold(Number(e.target.value))}
                                className="w-full accent-[#0099FF]"
                            />
                        </label>
                    </>
                ) : (
                    <label className="block">
                        <span className="mb-1 block font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
                            Hora
                        </span>
                        <input
                            type="time"
                            value={fireAt}
                            onChange={(e) => setFireAt(e.target.value)}
                            className="w-full rounded-xl border border-[#E8E2D2] bg-[#FAF7F0] px-3 py-3 font-display text-[15px] outline-none focus:border-[#0099FF] focus:bg-white"
                        />
                    </label>
                )}

                {/* Días */}
                <div>
                    <span className="mb-1 block font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
                        Días {dows.length === 7 ? "(todos)" : ""}
                    </span>
                    <div className="flex gap-1">
                        {DOWS_LABELS.map((label, i) => {
                            const dow = i + 1;
                            const active = dows.includes(dow);
                            return (
                                <button
                                    key={dow}
                                    type="button"
                                    onClick={() => toggleDow(dow)}
                                    className={`grid h-10 flex-1 place-items-center rounded-xl font-display text-[13px] font-bold transition ${
                                        active
                                            ? "bg-[#0F1115] text-[#FFD60A]"
                                            : "border border-[#E8E2D2] bg-white text-[#6B7080]"
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {error ? (
                    <p className="rounded-xl border border-[#F5C2C7] bg-[#FFF5F5] px-3 py-2 font-mono text-[11.5px] text-[#A02525]">
                        {error}
                    </p>
                ) : null}

                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={submitting || !nombre.trim() || (tab === "arrival" && (!stop || !linea))}
                    className="w-full rounded-2xl bg-[#0099FF] py-4 font-display text-[15px] font-semibold text-white shadow-[0_18px_40px_-18px_rgba(0,153,255,0.7)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#9DB6CC] disabled:shadow-none"
                >
                    {submitting ? "Guardando…" : "Crear rutina"}
                </button>
            </motion.div>
        </div>,
        document.body,
    );
}
