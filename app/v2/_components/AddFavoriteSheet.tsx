"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { useFavoritos } from "@/lib/bondi-api/hooks";
import { STOPS, type Stop } from "@/lib/static/stops";
import { ApiError } from "@/lib/bondi-api";

const EMOJIS = ["📍", "🏠", "💼", "🎓", "🏥", "🏪", "⚽", "🌊", "🍴", "🎬", "💪", "🎵"];

export function AddFavoriteSheet({
    initialStopId,
    initialApodo,
    onClose,
}: {
    initialStopId?: string;
    initialApodo?: string;
    onClose: () => void;
}) {
    const { create } = useFavoritos();
    const stopById = useMemo(() => new Map(STOPS.map((s) => [s.id, s])), []);

    const [stopId, setStopId] = useState(initialStopId ?? "");
    const [apodo, setApodo] = useState(initialApodo ?? "");
    const [emoji, setEmoji] = useState<string>("📍");
    const [stopQuery, setStopQuery] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const stop: Stop | undefined = stopId ? stopById.get(stopId) : undefined;

    const candidates = useMemo<Stop[]>(() => {
        const q = stopQuery.trim().toLowerCase();
        if (!q) return [];
        return STOPS.filter((s) => s.nombre.toLowerCase().includes(q)).slice(0, 8);
    }, [stopQuery]);

    async function onSubmit() {
        if (!stop || !apodo.trim() || submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            await create({
                parada_id: stop.id,
                apodo: apodo.trim(),
                emoji: emoji || null,
            });
            onClose();
        } catch (e) {
            if (e instanceof ApiError && e.code === "already_favorited") {
                setError("Ya tenés un favorito en esa parada.");
            } else {
                setError("No se pudo guardar. Probá de nuevo.");
            }
            setSubmitting(false);
        }
    }

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center">
            <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex w-full max-w-md flex-col gap-4 rounded-t-3xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)] shadow-2xl sm:rounded-3xl sm:pb-6"
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
                            Nuevo favorito
                        </p>
                        <h2 className="mt-1 font-display text-[20px] font-semibold leading-tight text-[#0F1115]">
                            Guardá una parada con apodo
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

                {/* Stop */}
                <div>
                    <label className="block">
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
                    </label>
                    {!stop && candidates.length > 0 ? (
                        <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-[#E8E2D2] bg-white">
                            {candidates.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => {
                                        setStopId(s.id);
                                        setStopQuery("");
                                        if (!apodo) setApodo(s.nombre);
                                    }}
                                    className="block w-full border-b border-[#F1ECDD] px-3 py-2 text-left font-display text-[13.5px] text-[#0F1115] last:border-b-0 hover:bg-[#FAF7F0]"
                                >
                                    <p className="truncate">{s.nombre}</p>
                                    <p className="font-mono text-[10.5px] text-[#6B7080]">
                                        {s.lineas.slice(0, 4).join(" · ")}
                                        {s.lineas.length > 4 ? ` +${s.lineas.length - 4}` : ""}
                                    </p>
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                {/* Apodo */}
                <label className="block">
                    <span className="mb-1 block font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
                        Apodo
                    </span>
                    <input
                        type="text"
                        value={apodo}
                        onChange={(e) => setApodo(e.target.value)}
                        placeholder='Ej. "Casa", "Laburo"'
                        maxLength={80}
                        className="w-full rounded-xl border border-[#E8E2D2] bg-[#FAF7F0] px-3 py-3 font-display text-[15px] outline-none focus:border-[#0099FF] focus:bg-white"
                    />
                </label>

                {/* Emoji */}
                <div>
                    <p className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
                        Emoji
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {EMOJIS.map((e) => (
                            <button
                                key={e}
                                type="button"
                                onClick={() => setEmoji(e)}
                                className={`grid h-10 w-10 place-items-center rounded-xl border text-[20px] transition ${
                                    emoji === e
                                        ? "border-[#0099FF] bg-[#EAF6FF]"
                                        : "border-[#E8E2D2] bg-white hover:border-[#0099FF]/40"
                                }`}
                            >
                                {e}
                            </button>
                        ))}
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
                    disabled={!stop || !apodo.trim() || submitting}
                    className="w-full rounded-2xl bg-[#0099FF] py-4 font-display text-[15px] font-semibold text-white shadow-[0_18px_40px_-18px_rgba(0,153,255,0.7)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#9DB6CC] disabled:shadow-none"
                >
                    {submitting ? "Guardando…" : "Guardar favorito"}
                </button>
            </motion.div>
        </div>,
        document.body,
    );
}
