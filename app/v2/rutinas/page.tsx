"use client";

import { motion } from "motion/react";
import { useDemoUser } from "@/lib/demo/DemoUserContext";
import { RoutineCard } from "../_components/RoutineCard";

export default function RutinasPage() {
  const { user } = useDemoUser();

  return (
    <div className="space-y-6">
      <header className="px-5 pt-2">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#6B7080]">
          Push notifications
        </p>
        <h1 className="mt-1 font-display text-[34px] font-semibold leading-[1.05] tracking-tight text-[#0F1115]">
          Tus <span className="text-[#0099FF]">rutinas</span>.
        </h1>
        <p className="mt-2 text-[14px] leading-snug text-[#6B7080]">
          La app te avisa antes que abrir nada. Configurás horarios y la lógica
          decide la línea más rápida con el dato en vivo.
        </p>
      </header>

      <div className="space-y-4 px-5">
        {user.rutinas.map((r, i) => (
          <RoutineCard key={r.id} rutina={r} index={i} />
        ))}
      </div>

      <motion.button
        type="button"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="mx-5 flex w-[calc(100%-2.5rem)] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#0F1115]/15 px-5 py-4 font-display text-[14px] font-semibold text-[#0F1115] transition hover:border-[#0099FF] hover:text-[#0099FF]"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Crear nueva rutina
      </motion.button>

      <div className="px-5 pt-2">
        <div className="rounded-2xl border border-[#E8E2D2] bg-white/70 p-4 backdrop-blur">
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-[#6B7080]">
            Próxima notificación
          </p>
          <p className="mt-2 font-display text-[16px] leading-tight text-[#0F1115]">
            Hoy 18:00 — “Vuelta del trabajo”. Te aviso cuando convenga arrancar.
          </p>
        </div>
      </div>
    </div>
  );
}
