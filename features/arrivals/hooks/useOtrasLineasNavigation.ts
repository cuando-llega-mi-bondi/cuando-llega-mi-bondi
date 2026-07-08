"use client";

import { useCallback } from "react";
import {
  getCalles,
  getIntersecciones,
  getParadas,
} from "@features/search/api/lineas";
import type { Linea } from "@shared/types";

export type SearchSelection = {
  codLinea: string;
  codCalle: string;
  codInterseccion: string;
  paradaId: string;
  selectedRamal: string;
};

interface UseOtrasLineasNavigationParams {
  calleLabel?: string;
  interseccionLabel?: string;
  onNavigate: (partial: Partial<SearchSelection>) => void;
  onConsultingChange: (consulting: boolean) => void;
}

export function useOtrasLineasNavigation({
  calleLabel,
  interseccionLabel,
  onNavigate,
  onConsultingChange,
}: UseOtrasLineasNavigationParams) {
  return useCallback(
    async (linea: Linea) => {
      if (!calleLabel || !interseccionLabel) return;

      onConsultingChange(false);
      onNavigate({ codLinea: linea.CodigoLineaParada });

      try {
        const calles = await getCalles(linea.CodigoLineaParada);
        const matchCalle = calles.find(
          (c) =>
            c.label.includes(calleLabel) || calleLabel.includes(c.label),
        );
        if (!matchCalle) return;

        const intersecciones = await getIntersecciones(
          linea.CodigoLineaParada,
          matchCalle.value,
        );
        const matchInter = intersecciones.find(
          (i) =>
            i.Descripcion.includes(interseccionLabel) ||
            interseccionLabel.includes(i.Descripcion),
        );
        if (!matchInter) return;

        const paradas = await getParadas(
          linea.CodigoLineaParada,
          matchCalle.value,
          matchInter.Codigo,
        );
        if (paradas.length === 0) return;

        onNavigate({
          codLinea: linea.CodigoLineaParada,
          codCalle: matchCalle.value,
          codInterseccion: matchInter.Codigo,
          paradaId: paradas[0].Identificador,
        });
        onConsultingChange(true);
      } catch (err) {
        console.error(err);
      }
    },
    [calleLabel, interseccionLabel, onConsultingChange, onNavigate],
  );
}
