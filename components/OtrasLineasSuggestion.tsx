import type { Linea } from "@/lib/types";
import { memo } from "react";

interface OtrasLineasSuggestionProps {
  lineas: Linea[];
  loading: boolean;
  onSelect: (linea: Linea) => void;
}

export const OtrasLineasSuggestion = memo(function OtrasLineasSuggestion({
  lineas,
  loading,
  onSelect,
}: OtrasLineasSuggestionProps) {
  if (!loading && lineas.length === 0) return null;

  return (
    <div className="mt-4 animate-slide-up rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex text-text-dim">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="13" rx="2"/><path d="M3 9h18"/><path d="M8 19v-3m8 3v-3"/><path d="M7 19h10"/><circle cx="7.5" cy="14.5" r=".5" fill="currentColor"/><circle cx="16.5" cy="14.5" r=".5" fill="currentColor"/></svg>
        </span>
        <span className="font-mono text-[11px] font-semibold tracking-[1.5px] text-text-dim">
          OTRAS LÍNEAS EN ESTA PARADA
        </span>
      </div>

      {loading ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="blink h-8 w-[60px] flex-shrink-0 rounded-lg bg-surface-2"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {lineas.map((linea) => (
            <button
              key={linea.CodigoLineaParada}
              onClick={() => onSelect(linea)}
              className="cursor-pointer rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 font-display text-sm font-bold text-accent transition hover:-translate-y-px hover:bg-accent hover:text-black active:scale-95"
            >
              {linea.Descripcion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
