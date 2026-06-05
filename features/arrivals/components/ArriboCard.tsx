"use client";

import type { Arribo } from "@features/arrivals/types";
import { getArriboColor } from "@features/arrivals/utils";
import { IconWheelchair } from "@shared/icons/IconWheelchair";
import { cn } from "@shared/utils";

export function ArriboCard({
  arribo,
}: {
  arribo: Arribo;
}) {
  const color = getArriboColor(arribo.Arribo);
  const isAdaptado = arribo.EsAdaptado === "True";

  const arriboColorClass =
    color === "#22c55e"
      ? "text-success"
      : color === "#0099ff"
        ? "text-secondary"
        : "text-foreground";

  return (
    <div className="arrival-row arrival-card flex flex-col gap-3">
      <div className="flex items-center gap-3.5">
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 font-sans text-[12px] font-medium tracking-[0.02em] text-muted-foreground">
            {(
              arribo.DescripcionCartelBandera ??
              arribo.DescripcionBandera ??
              ""
            ).toUpperCase()}
          </div>
          <div
            className={cn(
              "font-mono text-[22px] font-extrabold leading-[1.1] tracking-[-0.5px]",
              arriboColorClass,
            )}
          >
            {arribo.Arribo}
          </div>
          {isAdaptado && (
            <div className="inline-flex items-center gap-1 rounded border border-border px-1 py-[1px] text-[8px] text-muted-foreground">
              <IconWheelchair /> ADAPTADO
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
