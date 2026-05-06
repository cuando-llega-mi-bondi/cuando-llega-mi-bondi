"use client";

import { motion } from "motion/react";
import { useDemoUser } from "@/lib/demo/DemoUserContext";
import { stopById } from "@/lib/demo/data";

export default function FavoritosPage() {
  const { user } = useDemoUser();

  return (
    <div className="space-y-6">
      <header className="px-5 pt-2">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#6B7080]">
          Tus lugares
        </p>
        <h1 className="mt-1 font-display text-[34px] font-semibold leading-[1.05] tracking-tight text-[#0F1115]">
          Favoritos con <span className="text-[#0099FF]">apodo</span>.
        </h1>
        <p className="mt-2 text-[14px] leading-snug text-[#6B7080]">
          Guardá las paradas que más usás con un nombre tuyo. La app se acuerda
          y prioriza el dato que importa.
        </p>
      </header>

      <div className="space-y-4 px-5">
        {user.favoritos.map((f, i) => {
          const stop = stopById(f.stopId);
          return (
            <motion.article
              key={f.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-3xl border border-[#E8E2D2] bg-white v2-card-shadow"
            >
              <div className="flex items-stretch">
                <div
                  className="relative flex w-24 shrink-0 items-center justify-center"
                  style={{
                    background:
                      i % 2 === 0
                        ? "linear-gradient(135deg, #FFD60A 0%, #FFB000 100%)"
                        : "linear-gradient(135deg, #0099FF 0%, #0066CC 100%)",
                  }}
                >
                  <div className="absolute inset-0 v2-dotgrid opacity-30" aria-hidden />
                  <span className="relative text-[44px] leading-none">{f.emoji}</span>
                </div>
                <div className="min-w-0 flex-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#6B7080]">
                        {stop.id}
                      </p>
                      <h3 className="mt-0.5 font-display text-[20px] font-semibold leading-tight tracking-tight text-[#0F1115]">
                        {f.apodo}
                      </h3>
                      <p className="truncate text-[12.5px] text-[#6B7080]">
                        {stop.nombre}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="grid h-7 w-7 place-items-center rounded-full text-[#6B7080] hover:bg-[#FAF7F0] hover:text-[#0F1115]"
                      aria-label="Editar"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                        <circle cx="12" cy="6" r="1.4" fill="currentColor" />
                        <circle cx="12" cy="12" r="1.4" fill="currentColor" />
                        <circle cx="12" cy="18" r="1.4" fill="currentColor" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-dashed border-[#E8E2D2] pt-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-[#FFD60A] px-1.5 py-0.5 font-display text-[12px] font-bold text-[#0F1115]">
                        {f.proximoArribo.linea}
                      </span>
                      <span className="font-mono text-[11px] text-[#6B7080]">
                        {f.proximoArribo.bandera}
                      </span>
                    </div>
                    <p className="font-display text-[26px] font-semibold leading-none tracking-tight text-[#0F1115]">
                      {f.proximoArribo.minutos}
                      <span className="ml-0.5 text-[12px] font-medium text-[#6B7080]">min</span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
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
        Agregar favorito con apodo
      </motion.button>

    </div>
  );
}
