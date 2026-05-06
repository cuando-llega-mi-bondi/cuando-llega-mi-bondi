"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useBondiAuth } from "@/lib/bondi-api/AuthContext";
import { useRutinas } from "@/lib/bondi-api/hooks";
import type { Rutina } from "@/lib/bondi-api/types";
import { CreateRutinaSheet } from "../_components/CreateRutinaSheet";
import { PushToggle } from "../_components/PushToggle";
import { useConfirm } from "../_components/ConfirmDialog";

const DOW_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function RutinasPage() {
  const { state } = useBondiAuth();
  const { rutinas, loading, ready, update, remove } = useRutinas();
  const confirm = useConfirm();
  const [creating, setCreating] = useState(false);

  if (state.status === "loading") return <Skeleton />;
  if (state.status !== "authenticated") return <NeedLogin />;

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
          La app te avisa cuando conviene. Configurás horarios o paradas y ella decide.
        </p>
      </header>

      <div className="px-5">
        <PushToggle />
      </div>

      <div className="space-y-4 px-5">
        {!ready || loading ? (
          <Skeleton />
        ) : rutinas.length === 0 ? (
          <EmptyState onAdd={() => setCreating(true)} />
        ) : (
          <AnimatePresence initial={false}>
            {rutinas.map((r, i) => (
              <RutinaCard
                key={r.id}
                rutina={r}
                index={i}
                onToggle={(enabled) => void update(r.id, { enabled })}
                onDelete={async () => {
                  const ok = await confirm({
                    title: `Borrar "${r.nombre}"`,
                    body:
                      r.kind === "arrival_watch"
                        ? "No vas a recibir más avisos de este bondi."
                        : "No vas a recibir más este recordatorio.",
                    confirmLabel: "Borrar",
                    tone: "danger",
                  });
                  if (ok) void remove(r.id);
                }}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {ready ? (
        <motion.button
          type="button"
          onClick={() => setCreating(true)}
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
          Crear nueva rutina
        </motion.button>
      ) : null}

      {creating ? <CreateRutinaSheet onClose={() => setCreating(false)} /> : null}
    </div>
  );
}

function RutinaCard({
  rutina,
  index,
  onToggle,
  onDelete,
}: {
  rutina: Rutina;
  index: number;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
}) {
  const dows =
    rutina.active_dows && rutina.active_dows.length < 7
      ? rutina.active_dows.map((d) => DOW_NAMES[d - 1]).join(" · ")
      : "Todos los días";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: index * 0.04 }}
      className={`relative overflow-hidden rounded-3xl border bg-white p-5 v2-card-shadow ${
        rutina.enabled ? "border-[#E8E2D2]" : "border-dashed border-[#E8E2D2] opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
            {rutina.kind === "arrival_watch" ? "Aviso de bondi" : "Recordatorio"}
          </p>
          <h3 className="mt-0.5 font-display text-[18px] font-semibold leading-tight text-[#0F1115]">
            {rutina.nombre}
          </h3>
        </div>
        <Toggle checked={rutina.enabled} onChange={onToggle} />
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-dashed border-[#E8E2D2] pt-3">
        {rutina.kind === "arrival_watch" ? (
          <>
            <span className="rounded-md bg-[#FFD60A] px-1.5 py-0.5 font-display text-[12px] font-bold text-[#0F1115]">
              {rutina.linea_id}
            </span>
            <span className="font-mono text-[11px] text-[#6B7080]">
              ≤ {rutina.threshold_min} min · parada {rutina.parada_id}
            </span>
          </>
        ) : (
          <span className="font-mono text-[11px] text-[#6B7080]">
            🕒 {rutina.fire_at?.slice(0, 5)}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="font-mono text-[10.5px] text-[#6B7080]">{dows}</p>
        <button
          type="button"
          onClick={onDelete}
          className="font-mono text-[10.5px] uppercase tracking-wider text-[#A02525]"
        >
          borrar
        </button>
      </div>
    </motion.article>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? "bg-[#0099FF]" : "bg-[#E8E2D2]"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((i) => (
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
        Todavía no tenés rutinas.
      </p>
      <p className="mt-1 font-mono text-[11.5px] text-[#6B7080]">
        Configurá un aviso de bondi o un recordatorio diario.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 rounded-2xl bg-[#0099FF] px-5 py-3 font-display text-[14px] font-semibold text-white shadow-[0_18px_40px_-18px_rgba(0,153,255,0.7)]"
      >
        Crear primera rutina
      </button>
    </div>
  );
}

function NeedLogin() {
  return (
    <div className="space-y-6">
      <header className="px-5 pt-2">
        <h1 className="font-display text-[28px] font-semibold leading-[1.1] tracking-tight text-[#0F1115]">
          Rutinas
        </h1>
        <p className="mt-1 text-[14px] leading-snug text-[#6B7080]">
          Necesitás iniciar sesión para configurar push notifications.
        </p>
      </header>
      <div className="px-5">
        <Link
          href="/v2/login?next=/v2/rutinas"
          className="flex items-center justify-center rounded-2xl bg-[#0099FF] py-4 font-display text-[15px] font-semibold text-white shadow-[0_18px_40px_-18px_rgba(0,153,255,0.7)]"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
