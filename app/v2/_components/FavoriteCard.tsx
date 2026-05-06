"use client";

import { motion } from "motion/react";
import type { DemoFavorite } from "@/lib/demo/types";
import { stopById } from "@/lib/demo/data";

type Props = {
  favorito: DemoFavorite;
  index?: number;
  compact?: boolean;
};

export function FavoriteCard({ favorito, index = 0, compact = false }: Props) {
  const stop = stopById(favorito.stopId);
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`relative ${compact ? "min-w-[200px]" : "w-full"} overflow-hidden rounded-2xl border border-[#E8E2D2] bg-white p-4 v2-card-shadow`}
    >
      <div className="absolute -top-12 -right-8 h-32 w-32 rounded-full bg-[#0099FF]/8 blur-2xl" aria-hidden />
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xl leading-none">{favorito.emoji}</span>
        <span className="rounded-full bg-[#0F1115] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">
          {stop.id}
        </span>
      </div>
      <p className="mt-3 font-display text-[18px] font-semibold leading-tight text-[#0F1115]">
        {favorito.apodo}
      </p>
      <p className="truncate text-[12.5px] text-[#6B7080]">{stop.nombre}</p>

      <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-dashed border-[#E8E2D2] pt-3">
        <div>
          <span className="rounded-md bg-[#FFD60A] px-1.5 py-0.5 font-display text-[12px] font-bold text-[#0F1115]">
            {favorito.proximoArribo.linea}
          </span>
          <span className="ml-1.5 font-mono text-[11px] text-[#6B7080]">
            {favorito.proximoArribo.bandera}
          </span>
        </div>
        <p className="font-display text-[24px] font-semibold leading-none tracking-tight text-[#0F1115]">
          {favorito.proximoArribo.minutos}
          <span className="ml-0.5 text-[12px] font-medium text-[#6B7080]">min</span>
        </p>
      </div>
    </motion.article>
  );
}
