"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useDemoUser } from "@/lib/demo/DemoUserContext";
import type { DemoRoutine } from "@/lib/demo/types";

function pickActiveRoutine(rutinas: DemoRoutine[], hora: number): DemoRoutine | null {
  const enabled = rutinas.filter((r) => r.enabled);
  if (!enabled.length) return null;
  if (hora >= 6 && hora < 9) return enabled.find((r) => r.kind === "despertador") ?? enabled[0];
  if (hora >= 9 && hora < 14) return enabled.find((r) => r.kind === "ida-trabajo") ?? enabled[0];
  if (hora >= 16 && hora < 21) return enabled.find((r) => r.kind === "vuelta-trabajo") ?? enabled[0];
  return enabled[0];
}

function minutosAEta(min: number, ref: Date) {
  const d = new Date(ref.getTime() + min * 60_000);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export function ContextualBanner() {
  const { user } = useDemoUser();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const rutina = useMemo(
    () => (now ? pickActiveRoutine(user.rutinas, now.getHours()) : null),
    [user.rutinas, now],
  );

  const minutos = rutina?.kind === "vuelta-trabajo" ? 23 : rutina?.kind === "ida-trabajo" ? 14 : 7;
  const eta = now && rutina ? minutosAEta(minutos, now) : "—";

  if (!rutina) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="mx-5 mt-5"
    >
      <div className="relative overflow-hidden rounded-3xl border border-[#0F1115]/90 bg-[#0F1115] p-5 text-white">
        <div className="absolute inset-0 v2-dotgrid opacity-25" aria-hidden />
        <div
          className="absolute -right-20 -top-16 h-64 w-64 rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,214,10,0.55), transparent 70%)",
          }}
          aria-hidden
        />
        <div className="absolute -left-10 -bottom-16 h-48 w-48 rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(0,153,255,0.55), transparent 70%)",
          }}
          aria-hidden
        />

        <div className="relative flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wider text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FFD60A]" /> Rutina activa
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-white/60">
            {rutina.titulo}
          </span>
        </div>

        <div className="relative mt-4">
          <p className="font-display text-[15px] leading-snug text-white/85">
            {rutina.kind === "vuelta-trabajo"
              ? "Tu vuelta del trabajo arranca en"
              : rutina.kind === "ida-trabajo"
                ? "Tu ida al trabajo arranca en"
                : "Tu próximo bondi pasa en"}
          </p>
          <p className="mt-1 flex items-baseline gap-2 font-display text-[64px] font-semibold leading-none tracking-tight">
            <span className="text-white">{minutos}</span>
            <span className="text-[20px] font-medium text-white/60">min</span>
          </p>
          <p className="mt-3 inline-flex items-center gap-2 font-mono text-[12px] text-white/70">
            <span className="rounded-md bg-[#FFD60A] px-1.5 py-0.5 font-display text-[12px] font-bold text-[#0F1115]">
              {rutina.linea}
            </span>
            llega a las
            <span className="text-white">{eta}</span>
          </p>
        </div>

        <div className="relative mt-5 flex items-center justify-end gap-2">
          <Link
            href="/v2/como-llego"
            className="group inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0F1115] transition hover:bg-[#FFD60A]"
          >
            Ver itinerario
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
              <path d="M5 12h14m-5-6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
