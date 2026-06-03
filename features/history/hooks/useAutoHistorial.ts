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
  const savedRef = useRef("");

  useEffect(() => {
    if (!isConsulting || !paradaId || !codLinea || arribos.length === 0) return;
    const entryId = `${paradaId}_${codLinea}`;
    if (savedRef.current === entryId) return;
    savedRef.current = entryId;
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
