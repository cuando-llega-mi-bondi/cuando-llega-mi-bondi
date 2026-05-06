"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useDemoUser } from "@/lib/demo/DemoUserContext";
import { Avatar } from "./Avatar";

function saludoPorHora(h: number) {
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buen día";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function HomeHeader() {
  const { user } = useDemoUser();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const hora = now?.getHours() ?? 18;
  const saludo = saludoPorHora(hora);

  return (
    <header className="px-5 pt-2">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between"
      >
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#6B7080]">
            {now
              ? now.toLocaleDateString("es-AR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
              : "—"}
          </p>
          <h1 className="font-display text-[30px] font-semibold leading-[1.05] tracking-tight text-[#0F1115]">
            {saludo},
            <br />
            <span className="text-[#0099FF]">{user.nombre}.</span>
          </h1>
        </div>
        <Avatar iniciales={user.iniciales} size="lg" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="mt-3 text-[14px] leading-snug text-[#6B7080]"
      >
        {user.viajesEstaSemana} viajes esta semana ·{" "}
        <span className="text-[#0F1115]">{user.zonaHabitual}</span> es tu zona habitual.
      </motion.p>
    </header>
  );
}
