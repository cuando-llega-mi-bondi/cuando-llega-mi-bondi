"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { search } from "@/lib/static/search";
import { LINES } from "@/lib/static/lines";
import { STOPS } from "@/lib/static/stops";

const SUGERIDOS = ["541", "511", "522", "BATAN", "Independencia"];

export default function BuscarPage() {
  const [q, setQ] = useState("");
  const results = useMemo(() => search(q), [q]);

  const grouped = useMemo(() => {
    const lineas = results.filter((r) => r.kind === "linea");
    const paradas = results.filter((r) => r.kind === "parada");
    return { lineas, paradas };
  }, [results]);

  return (
    <div className="space-y-6">
      <header className="px-5 pt-2">
        <h1 className="font-display text-[28px] font-semibold leading-[1.1] tracking-tight text-[#0F1115]">
          Buscar
        </h1>
        <p className="mt-1 text-[14px] leading-snug text-[#6B7080]">
          Línea, parada, calle o lugar.
        </p>
      </header>

      <div className="px-5">
        <div className="relative">
          <div
            className="flex items-center gap-3 rounded-2xl border border-[#0F1115]/10 bg-white px-4 py-3.5 v2-card-shadow focus-within:border-[#0099FF]"
            style={{
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.9) inset, 0 22px 50px -22px rgba(15,17,21,0.25)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-[#6B7080]">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Línea o calle (ej. "541", "Independencia")'
              className="flex-1 bg-transparent font-display text-[16px] font-medium text-[#0F1115] outline-none placeholder:text-[#6B7080]/70"
            />
            {q ? (
              <button
                type="button"
                onClick={() => setQ("")}
                className="grid h-7 w-7 place-items-center rounded-full bg-[#FAF7F0] text-[#6B7080] hover:bg-[#0F1115] hover:text-white"
                aria-label="Limpiar"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                  <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {!q ? (
        <div className="px-5">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
            Sugerencias
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGERIDOS.map((s) => (
              <button
                key={s}
                onClick={() => setQ(s)}
                className="rounded-full border border-[#E8E2D2] bg-white px-3 py-1.5 font-mono text-[12px] text-[#0F1115] transition hover:border-[#0099FF] hover:text-[#0099FF]"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Stat numero={LINES.length.toString()} label="líneas" />
            <Stat numero={STOPS.length.toLocaleString("es-AR")} label="paradas" />
          </div>
        </div>
      ) : (
        <div className="px-5">
          <AnimatePresence mode="wait">
            {results.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-dashed border-[#E8E2D2] bg-white/50 p-6 text-center"
              >
                <p className="font-display text-[16px] font-semibold text-[#0F1115]">
                  Sin resultados para "{q}"
                </p>
                <p className="mt-1 text-[13px] text-[#6B7080]">
                  Probá con un código de línea o el ID de parada.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-5"
              >
                {grouped.lineas.length > 0 && (
                  <ResultGroup label="Líneas">
                    {grouped.lineas.map((r) =>
                      r.kind === "linea" ? (
                        <ResultRow
                          key={`line-${r.line.codigo}`}
                          href={`/v2/linea/${r.line.descripcion}`}
                          chip={r.line.descripcion}
                          chipColor="#FFD60A"
                          title={`Línea ${r.line.descripcion}`}
                          subtitle={`${r.line.paradas} paradas`}
                        />
                      ) : null,
                    )}
                  </ResultGroup>
                )}
                {grouped.paradas.length > 0 && (
                  <ResultGroup label="Paradas">
                    {grouped.paradas.map((r) =>
                      r.kind === "parada" ? (
                        <StopRow
                          key={`stop-${r.stop.id}`}
                          href={`/v2/parada/${encodeURIComponent(r.stop.id)}`}
                          title={r.stop.nombre}
                          lineas={r.stop.lineas}
                        />
                      ) : null,
                    )}
                  </ResultGroup>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function Stat({ numero, label }: { numero: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#E8E2D2] bg-white p-4 v2-card-shadow">
      <p className="font-display text-[40px] font-semibold leading-none tracking-tight text-[#0F1115]">
        {numero}
      </p>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-[#6B7080]">
        {label} en MDP
      </p>
    </div>
  );
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
        {label}
      </p>
      <div className="overflow-hidden rounded-2xl border border-[#E8E2D2] bg-white v2-card-shadow">
        {children}
      </div>
    </div>
  );
}

function ResultRow({
  href,
  chip,
  title,
  subtitle,
  chipColor,
  chipTextColor = "#0F1115",
}: {
  href: string;
  chip: string;
  title: string;
  subtitle: string;
  chipColor: string;
  chipTextColor?: string;
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-3 border-b border-[#F1ECDD] px-4 py-3 text-left last:border-b-0 hover:bg-[#FAF7F0]"
    >
      <span
        className="grid h-9 min-w-9 shrink-0 place-items-center rounded-lg px-1.5 font-display text-[12.5px] font-bold"
        style={{
          background: chipColor,
          color: chipTextColor,
        }}
      >
        {chip}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[14.5px] font-semibold text-[#0F1115]">
          {title}
        </p>
        <p className="truncate font-mono text-[11px] text-[#6B7080]">{subtitle}</p>
      </div>
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[#6B7080]">
        <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

function StopRow({
  href,
  title,
  lineas,
}: {
  href: string;
  title: string;
  lineas: string[];
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-3 border-b border-[#F1ECDD] px-4 py-3 text-left last:border-b-0 hover:bg-[#FAF7F0]"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0099FF] text-white">
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path
            d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[14.5px] font-semibold text-[#0F1115]">
          {title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1">
          {lineas.slice(0, 5).map((l) => (
            <span
              key={l}
              className="rounded bg-[#FFD60A] px-1.5 py-0.5 font-display text-[10.5px] font-bold text-[#0F1115]"
            >
              {l}
            </span>
          ))}
          {lineas.length > 5 ? (
            <span className="font-mono text-[10.5px] text-[#6B7080]">
              +{lineas.length - 5}
            </span>
          ) : null}
        </div>
      </div>
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[#6B7080]">
        <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
