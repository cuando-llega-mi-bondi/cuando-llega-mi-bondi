"use client";

import { motion } from "motion/react";
import type { DemoRoutine } from "@/lib/demo/types";
import { useDemoUser } from "@/lib/demo/DemoUserContext";

const DAY_LABEL: Record<DemoRoutine["dias"][number], string> = {
  L: "Lu",
  M: "Ma",
  X: "Mi",
  J: "Ju",
  V: "Vi",
  S: "Sá",
  D: "Do",
};

const ICONS: Record<DemoRoutine["kind"], React.ReactNode> = {
  despertador: (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 4 3 6m18 0-2-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  "ida-trabajo": (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path d="M5 13h14m-5-6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "vuelta-trabajo": (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path d="M19 13H5m5-6-6 6 6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

type Props = {
  rutina: DemoRoutine;
  index?: number;
};

export function RoutineCard({ rutina, index = 0 }: Props) {
  const { toggleRoutine } = useDemoUser();
  const accent = rutina.kind === "despertador" ? "#FFD60A" : "#0099FF";
  const dias = (["L", "M", "X", "J", "V", "S", "D"] as const).map((d) => ({
    d,
    on: rutina.dias.includes(d),
  }));

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl border border-[#E8E2D2] bg-white p-5 v2-card-shadow"
    >
      <div
        className="absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-50 blur-2xl"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div
          className="grid h-11 w-11 place-items-center rounded-2xl"
          style={{ background: accent + "1f", color: accent === "#FFD60A" ? "#0F1115" : accent }}
        >
          {ICONS[rutina.kind]}
        </div>
        <button
          type="button"
          onClick={() => toggleRoutine(rutina.id)}
          aria-pressed={rutina.enabled}
          className={`relative h-7 w-12 shrink-0 rounded-full border transition ${
            rutina.enabled
              ? "border-[#0F1115] bg-[#0F1115]"
              : "border-[#E8E2D2] bg-[#EFEAE0]"
          }`}
        >
          <span
            className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
            style={{ left: rutina.enabled ? "calc(100% - 22px)" : "2px" }}
          />
        </button>
      </div>

      <div className="relative mt-4">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
          {rutina.hora}
        </p>
        <h3 className="font-display text-[22px] font-semibold leading-tight tracking-tight text-[#0F1115]">
          {rutina.titulo}
        </h3>
        <p className="mt-1 text-[13px] leading-snug text-[#6B7080]">{rutina.descripcion}</p>
      </div>

      <div className="relative mt-4 flex items-center gap-1.5">
        {dias.map(({ d, on }) => (
          <span
            key={d}
            className={`grid h-7 w-7 place-items-center rounded-full font-mono text-[10.5px] font-semibold ${
              on ? "bg-[#0F1115] text-white" : "bg-[#FAF7F0] text-[#6B7080] border border-dashed border-[#E8E2D2]"
            }`}
          >
            {DAY_LABEL[d][0]}
          </span>
        ))}
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-dashed border-[#E8E2D2] pt-4">
        <p className="font-mono text-[11px] uppercase tracking-wider text-[#6B7080]">
          Notificó <span className="text-[#0F1115]">{rutina.vecesEstaSemana}×</span> esta semana
        </p>
        {rutina.linea ? (
          <span className="rounded-md bg-[#FFD60A] px-1.5 py-0.5 font-display text-[12px] font-bold text-[#0F1115]">
            {rutina.linea}
          </span>
        ) : null}
      </div>
    </motion.article>
  );
}
