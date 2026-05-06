"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useBondiAuth } from "@/lib/bondi-api/AuthContext";
import { useFavoritos } from "@/lib/bondi-api/hooks";
import { STOPS } from "@/lib/static/stops";
import { AddFavoriteSheet } from "../_components/AddFavoriteSheet";
import { useConfirm } from "../_components/ConfirmDialog";

export default function FavoritosPage() {
  const { state } = useBondiAuth();
  const { favoritos, loading, ready, remove } = useFavoritos();
  const confirm = useConfirm();
  const [adding, setAdding] = useState(false);

  const stopById = useMemo(() => {
    const m = new Map<string, (typeof STOPS)[number]>();
    for (const s of STOPS) m.set(s.id, s);
    return m;
  }, []);

  if (state.status === "loading") {
    return <PageShell loading />;
  }

  if (state.status !== "authenticated") {
    return <NeedLogin />;
  }

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
          Las paradas que más usás, con un nombre tuyo.
        </p>
      </header>

      <div className="space-y-4 px-5">
        {!ready || loading ? (
          <Skeleton />
        ) : favoritos.length === 0 ? (
          <EmptyState onAdd={() => setAdding(true)} />
        ) : (
          <AnimatePresence initial={false}>
            {favoritos.map((f, i) => {
              const stop = stopById.get(f.parada_id);
              return (
                <motion.article
                  key={f.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
                      <span className="relative text-[44px] leading-none">
                        {f.emoji ?? "📍"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-display text-[20px] font-semibold leading-tight tracking-tight text-[#0F1115]">
                            {f.apodo}
                          </h3>
                          <p className="mt-0.5 truncate text-[12.5px] text-[#6B7080]">
                            {stop?.nombre ?? `Parada ${f.parada_id}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await confirm({
                              title: `Borrar "${f.apodo}"`,
                              body: `Vas a quitar este favorito${stop ? ` (${stop.nombre})` : ""}. Lo podés volver a agregar después.`,
                              confirmLabel: "Borrar",
                              tone: "danger",
                            });
                            if (ok) void remove(f.id);
                          }}
                          className="grid h-7 w-7 place-items-center rounded-full text-[#6B7080] hover:bg-[#FAF7F0] hover:text-[#0F1115]"
                          aria-label="Borrar"
                        >
                          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                            <path
                              d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m1 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                      <Link
                        href={`/v2/parada/${encodeURIComponent(f.parada_id)}`}
                        className="mt-3 inline-flex items-center gap-1 border-t border-dashed border-[#E8E2D2] pt-3 font-mono text-[11px] uppercase tracking-wider text-[#0099FF]"
                      >
                        Ver arribos →
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {ready && favoritos.length > 0 ? (
        <motion.button
          type="button"
          onClick={() => setAdding(true)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mx-5 flex w-[calc(100%-2.5rem)] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#0F1115]/15 px-5 py-4 font-display text-[14px] font-semibold text-[#0F1115] transition hover:border-[#0099FF] hover:text-[#0099FF]"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Agregar otro
        </motion.button>
      ) : null}

      {adding ? <AddFavoriteSheet onClose={() => setAdding(false)} /> : null}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[120px] animate-pulse rounded-3xl border border-[#E8E2D2] bg-white/40"
        />
      ))}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-[#E8E2D2] bg-white/50 p-6 text-center">
      <p className="font-display text-[16px] font-semibold text-[#0F1115]">
        Todavía no guardaste favoritos.
      </p>
      <p className="mt-1 font-mono text-[11.5px] text-[#6B7080]">
        Agregá una parada con un apodo tuyo para tenerla a mano.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 rounded-2xl bg-[#0099FF] px-5 py-3 font-display text-[14px] font-semibold text-white shadow-[0_18px_40px_-18px_rgba(0,153,255,0.7)]"
      >
        Agregar favorito
      </button>
    </div>
  );
}

function NeedLogin() {
  return (
    <div className="space-y-6">
      <header className="px-5 pt-2">
        <h1 className="font-display text-[28px] font-semibold leading-[1.1] tracking-tight text-[#0F1115]">
          Favoritos
        </h1>
        <p className="mt-1 text-[14px] leading-snug text-[#6B7080]">
          Necesitás iniciar sesión para guardar favoritos.
        </p>
      </header>
      <div className="px-5">
        <Link
          href="/v2/login?next=/v2/favoritos"
          className="flex items-center justify-center rounded-2xl bg-[#0099FF] py-4 font-display text-[15px] font-semibold text-white shadow-[0_18px_40px_-18px_rgba(0,153,255,0.7)]"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}

function PageShell({ loading }: { loading?: boolean }) {
  return (
    <div className="space-y-6 px-5 pt-2">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#6B7080]">
        {loading ? "Cargando…" : ""}
      </p>
      <Skeleton />
    </div>
  );
}
