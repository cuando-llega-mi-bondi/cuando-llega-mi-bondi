"use client";

import Link from "next/link";
import useSWR from "swr";
import { Rocket } from "lucide-react";
import type { AdHistoryView } from "@features/sponsors/lib/purchases";
import { formatArs } from "@features/sponsors/lib/pricing";
import { AdIcon } from "./AdIcon";
import { cn } from "@shared/utils";

const DATE_FORMAT = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

async function fetchHistory(url: string): Promise<AdHistoryView> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("history");
  return res.json() as Promise<AdHistoryView>;
}

function formatSince(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : DATE_FORMAT.format(date);
}

/**
 * Todos los pagos aprobados, del más nuevo al más viejo. Sirve de prueba de que
 * el lugar se usa y de referencia de cuánto se viene pagando. Cada fila tiene
 * un botón "Potenciar" que lleva a la pantalla dedicada para sumarle plata a
 * ese aviso, sin tener que volver a cargar sus datos.
 */
export function AdHistory({
  liveIds,
  mineIds,
}: {
  liveIds: string[];
  mineIds?: string[];
}) {
  const { data } = useSWR("/api/ads/history", fetchHistory, { revalidateOnFocus: false });
  const entries = data?.entries ?? [];
  if (entries.length === 0) return null;
  const total = data?.total ?? entries.length;

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
          YA PASARON POR ACÁ
        </p>
        <p className="text-[11px] text-muted-foreground">
          {total === 1 ? "1 negocio" : `${total} negocios`}
        </p>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {entries.map((entry) => {
          const podiumRank = liveIds.indexOf(entry.id);
          const live = podiumRank !== -1;
          const mine = mineIds?.includes(entry.id) ?? false;
          return (
            <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-3">
              <AdIcon href={entry.href} title={entry.title} size="sm" />
              <span className="min-w-0 flex-1">
                <a
                  href={entry.href}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="line-clamp-1 text-[14px] font-bold text-foreground hover:text-secondary"
                >
                  {entry.title}
                </a>
                <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  {formatSince(entry.since)}
                  {live ? (
                    <span
                      className={cn(
                        "shrink-0 whitespace-nowrap rounded-full px-1.5 py-0.5 font-bold",
                        podiumRank === 0 ? "bg-amarillo/15 text-amarillo" : "bg-secondary/15 text-secondary",
                      )}
                    >
                      Top {podiumRank + 1}
                    </span>
                  ) : null}
                  {mine ? (
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-amarillo/15 px-1.5 py-0.5 font-bold text-amarillo">
                      tuyo
                    </span>
                  ) : null}
                </span>
              </span>
              <span
                className={cn(
                  "shrink-0 text-[13px] font-black tabular-nums",
                  live ? "text-amarillo" : "text-muted-foreground",
                )}
              >
                {formatArs(entry.amountArs)}
              </span>
              <Link
                href={`/anunciate/boost/${entry.id}`}
                aria-label={`Potenciar ${entry.title}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-opacity hover:opacity-90"
              >
                <Rocket className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        Lo que pagó cada uno es público: así se ve cuánto hace falta para entrar.
      </p>
    </section>
  );
}
