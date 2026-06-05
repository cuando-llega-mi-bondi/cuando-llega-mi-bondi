"use client";

import { useEffect, useRef } from "react";
import type { Arribo } from "@features/arrivals/types";
import {
  arriboBanderaLabel,
  arriboLineaDescripcion,
} from "@features/arrivals/utils";
import type { HistorialEntry } from "@features/history/types";

interface UseAutoHistorialParams {
  isConsulting: boolean;
  paradaId: string;
  codLinea: string;
  arribos: Arribo[];
  lineaLabel: string;
  calleLabel?: string;
  interseccionLabel?: string;
  pushHistorialEntry: (entry: HistorialEntry) => void;
}

export function useAutoHistorial({
  isConsulting,
  paradaId,
  codLinea,
  arribos,
  lineaLabel,
  calleLabel,
  interseccionLabel,
  pushHistorialEntry,
}: UseAutoHistorialParams) {
  const savedRef = useRef({ id: "", hasLabels: false });

  useEffect(() => {
    if (!isConsulting || !paradaId || !codLinea || codLinea === "undefined" || arribos.length === 0) return;
    
    const entryId = `${paradaId}_${codLinea}`;
    const hasLabels = Boolean(calleLabel && interseccionLabel);
    
    if (savedRef.current.id === entryId) {
        // Si ya guardamos esta consulta y ya teníamos los labels, no hacer nada.
        // O si ya la guardamos y todavía NO tenemos labels, tampoco hacer nada.
        if (savedRef.current.hasLabels || !hasLabels) {
            return;
        }
    }
    
    savedRef.current = { id: entryId, hasLabels };
    const first = arribos[0];
    const historialLineaLabel =
      lineaLabel.trim() ||
      arriboLineaDescripcion(first) ||
      first.DescripcionLinea?.trim() ||
      codLinea.trim();
    pushHistorialEntry({
      id: entryId,
      paradaId,
      codLinea,
      lineaLabel: historialLineaLabel || undefined,
      descripcionLinea:
        arriboLineaDescripcion(first) ||
        first.DescripcionLinea ||
        historialLineaLabel,
      descripcionBandera:
        arriboBanderaLabel(first) || first.DescripcionBandera || "",
      calleLabel,
      interseccionLabel,
      timestamp: Date.now(),
    });
  }, [
    arribos,
    calleLabel,
    codLinea,
    interseccionLabel,
    isConsulting,
    lineaLabel,
    paradaId,
    pushHistorialEntry,
  ]);

  return savedRef;
}
