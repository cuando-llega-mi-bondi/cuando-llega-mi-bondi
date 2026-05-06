"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useBondiAuth } from "@/lib/bondi-api/AuthContext";
import { Avatar } from "./Avatar";

function saludoPorHora(h: number) {
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buen día";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

function inicialesDe(nombre: string | null | undefined): string {
  if (!nombre) return "?";
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0]!.slice(0, 1).toUpperCase();
  return (partes[0]![0]! + partes[partes.length - 1]![0]!).toUpperCase();
}

export function HomeHeader() {
  const { state } = useBondiAuth();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const hora = now?.getHours() ?? 18;
  const saludo = saludoPorHora(hora);
  const nombre =
    state.status === "authenticated" ? state.user.nombre || state.user.email : null;
  const iniciales = inicialesDe(nombre);

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
            {saludo}
            {nombre ? (
              <>
                ,
                <br />
                <span className="text-[#0099FF]">{nombre}.</span>
              </>
            ) : (
              "."
            )}
          </h1>
        </div>
        {nombre ? <Avatar iniciales={iniciales} size="lg" /> : null}
      </motion.div>
    </header>
  );
}
