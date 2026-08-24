"use client";

import useSWR from "swr";
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
 * el lugar se usa y de referencia de cuánto se viene pagando.
 */
export function AdHistory({ liveIds }: { liveIds: string[] }) {
  const { data } = useSWR("/api/ads/history", fetchHistory, { revalidateOnFocus: false });
  const entries = data?.entries ?? [];
  if (entries.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
          YA PASARON POR ACÁ
        </p>
        <p className="text-[11px] text-muted-foreground">
          {data?.total === 1 ? "1 negocio" : `${data?.total ?? entries.length} negocios`}
        </p>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {entries.map((entry) => {
          const live = liveIds.includes(entry.id);
          return (
            <li key={entry.id} className="flex items-center gap-3 px-3.5 py-3">
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
                    <span className="rounded-full bg-secondary/15 px-1.5 py-0.5 font-bold text-secondary">
                      al aire
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
