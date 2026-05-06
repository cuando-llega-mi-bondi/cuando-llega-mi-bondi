"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useBondiAuth } from "@/lib/bondi-api/AuthContext";
import { useFavoritos } from "@/lib/bondi-api/hooks";
import { STOPS, type Stop } from "@/lib/static/stops";
import type { Favorito } from "@/lib/bondi-api/types";

export function HomeFavorites() {
  const { state } = useBondiAuth();
  const { favoritos, loading, ready } = useFavoritos();

  const stopById = useMemo(() => {
    const m = new Map<string, Stop>();
    for (const s of STOPS) m.set(s.id, s);
    return m;
  }, []);

  if (state.status === "loading") {
    return <SkeletonStrip />;
  }

  if (state.status !== "authenticated") {
    return (
      <div className="rounded-2xl border border-dashed border-[#E8E2D2] bg-white/50 p-5 text-center">
        <p className="font-display text-[15px] font-semibold text-[#0F1115]">
          Iniciá sesión para guardar paradas con apodo.
        </p>
        <Link
          href="/v2/login?next=/v2"
          className="mt-3 inline-flex rounded-2xl bg-[#0099FF] px-4 py-2 font-display text-[13px] font-semibold text-white shadow-[0_18px_40px_-18px_rgba(0,153,255,0.7)]"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (!ready || loading) {
    return <SkeletonStrip />;
  }

  if (favoritos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E8E2D2] bg-white/50 p-5 text-center">
        <p className="font-display text-[15px] font-semibold text-[#0F1115]">
          Todavía no tenés favoritos.
        </p>
        <p className="mt-1 font-mono text-[11px] text-[#6B7080]">
          Agregá una parada con un apodo tuyo para tenerla a mano.
        </p>
        <Link
          href="/v2/favoritos"
          className="mt-3 inline-flex rounded-2xl bg-[#0099FF] px-4 py-2 font-display text-[13px] font-semibold text-white shadow-[0_18px_40px_-18px_rgba(0,153,255,0.7)]"
        >
          Agregar favorito
        </Link>
      </div>
    );
  }

  return (
    <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {favoritos.map((f, i) => (
        <FavoriteChip
          key={f.id}
          favorito={f}
          stop={stopById.get(f.parada_id)}
          index={i}
        />
      ))}
    </div>
  );
}

function FavoriteChip({
  favorito,
  stop,
  index,
}: {
  favorito: Favorito;
  stop: Stop | undefined;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative min-w-[200px] overflow-hidden rounded-2xl border border-[#E8E2D2] bg-white v2-card-shadow"
    >
      <Link
        href={`/v2/parada/${encodeURIComponent(favorito.parada_id)}`}
        className="block p-4"
      >
        <div className="absolute -top-12 -right-8 h-32 w-32 rounded-full bg-[#0099FF]/8 blur-2xl" aria-hidden />
        <div className="flex items-center justify-between gap-2">
          <span className="text-2xl leading-none">{favorito.emoji ?? "📍"}</span>
          <span className="rounded-full bg-[#0F1115] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">
            {favorito.parada_id}
          </span>
        </div>
        <p className="mt-3 font-display text-[18px] font-semibold leading-tight text-[#0F1115]">
          {favorito.apodo}
        </p>
        <p className="truncate text-[12.5px] text-[#6B7080]">
          {stop?.nombre ?? `Parada ${favorito.parada_id}`}
        </p>
        <p className="mt-3 inline-flex items-center gap-1 border-t border-dashed border-[#E8E2D2] pt-3 font-mono text-[11px] uppercase tracking-wider text-[#0099FF]">
          Ver arribos →
        </p>
      </Link>
    </motion.div>
  );
}

function SkeletonStrip() {
  return (
    <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="min-w-[200px] h-[140px] animate-pulse rounded-2xl border border-[#E8E2D2] bg-white/40"
        />
      ))}
    </div>
  );
}
