"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { resolveUbicacionFormularioPorParada } from "@features/search/api/resolveUbicacion";
import { useSearchFlowStore } from "@features/search/store/useSearchFlowStore";
import { useCalles } from "@features/search/hooks/useCalles";
import { useIntersecciones } from "@features/search/hooks/useIntersecciones";
import { useLineas } from "@features/search/hooks/useLineas";
import { useParadas } from "@features/search/hooks/useParadas";
import { useUrlSync } from "@shared/hooks/useUrlSync";
import { cleanLabel } from "@shared/utils";

/**
 * Hook de cableado del flujo de búsqueda. Se monta UNA sola vez (en
 * SearchFlowProvider): conecta la selección del store de zustand con los
 * fetches SWR, los efectos de auto-avance y la sincronización de URL, y
 * computa las opciones/labels derivadas que expone el context.
 *
 * El estado vive en useSearchFlowStore — los componentes lo leen con
 * selectores; acá solo se deriva data.
 */
export function useSearchFlow() {
  const router = useRouter();

  const { codLinea, codCalle, codInterseccion, paradaId } = useSearchFlowStore(
    useShallow((s) => ({
      codLinea: s.codLinea,
      codCalle: s.codCalle,
      codInterseccion: s.codInterseccion,
      paradaId: s.paradaId,
    })),
  );

  const setError = useSearchFlowStore((s) => s.setError);

  const setUrlCodLinea = useCallback(
    (v: string) => useSearchFlowStore.getState().resetSelection({ codLinea: v }),
    [],
  );
  const setUrlParadaId = useCallback(
    (v: string) => useSearchFlowStore.getState().applySelection({ paradaId: v }),
    [],
  );
  const setUrlConsulting = useCallback(
    () => useSearchFlowStore.getState().setIsConsulting(true),
    [],
  );

  useUrlSync({
    codLinea,
    paradaId,
    setCodLinea: setUrlCodLinea,
    setParadaId: setUrlParadaId,
    onHydratedSelection: setUrlConsulting,
  });

  const { lineas, loadingLineas } = useLineas({ onError: setError });
  const { callesRaw, loadingCalles } = useCalles(codLinea);
  const { intersecciones, loadingInter } = useIntersecciones(codLinea, codCalle);
  const { paradas, loadingParadas } = useParadas(
    codLinea,
    codCalle,
    codInterseccion,
  );

  const lineaOptions = useMemo(
    () =>
      lineas.map((l) => ({
        value: l.CodigoLineaParada,
        label: l.Descripcion,
      })),
    [lineas],
  );

  const calles = useMemo(
    () =>
      callesRaw.map((c) => ({
        value: c.Codigo,
        label: cleanLabel(c.Descripcion),
      })),
    [callesRaw],
  );

  const interOptions = useMemo(
    () =>
      intersecciones.map((i) => ({
        value: i.Codigo,
        label: cleanLabel(i.Descripcion),
      })),
    [intersecciones],
  );

  const destinoOptions = useMemo(() => {
    const seen = new Set<string>();
    return paradas.reduce<{ value: string; label: string }[]>((acc, p) => {
      if (!seen.has(p.Identificador)) {
        seen.add(p.Identificador);
        acc.push({
          value: p.Identificador,
          label: p.AbreviaturaBandera ?? p.Identificador,
        });
      }
      return acc;
    }, []);
  }, [paradas]);

  const ramalOptions = useMemo(() => {
    const matched = paradas.filter((p) => p.Identificador === paradaId);
    return [
      { value: "TODOS", label: "Todos" },
      ...matched.map((r) => ({
        value: r.AbreviaturaBandera,
        label: r.AbreviaturaBandera,
      })),
    ];
  }, [paradas, paradaId]);

  const paradaBanderaAbrevs = useMemo(() => {
    const set = new Set<string>();
    for (const p of paradas.filter((p) => p.Identificador === paradaId)) {
      const v = (p.AbreviaturaBandera ?? "").trim();
      if (v) set.add(v.toUpperCase());
    }
    return Array.from(set);
  }, [paradas, paradaId]);

  const selectedParada = useMemo(
    () => paradas.find((p) => p.Identificador === paradaId),
    [paradas, paradaId],
  );

  const calleLabel = calles.find((c) => c.value === codCalle)?.label;
  const interseccionLabel = interOptions.find(
    (i) => i.value === codInterseccion,
  )?.label;
  const lineaLabel =
    lineas.find((l) => l.CodigoLineaParada === codLinea)?.Descripcion ?? "";

  // Auto-avance: cuando un paso tiene una única opción, se selecciona sola.
  useEffect(() => {
    if (!codLinea || codCalle || loadingCalles || calles.length !== 1) return;
    useSearchFlowStore.getState().applySelection({ codCalle: calles[0].value });
  }, [codLinea, codCalle, loadingCalles, calles]);

  useEffect(() => {
    if (
      !codCalle ||
      codInterseccion ||
      loadingInter ||
      interOptions.length !== 1
    )
      return;
    useSearchFlowStore
      .getState()
      .applySelection({ codInterseccion: interOptions[0].value });
  }, [codCalle, codInterseccion, loadingInter, interOptions]);

  useEffect(() => {
    if (
      !codInterseccion ||
      paradaId ||
      loadingParadas ||
      destinoOptions.length !== 1
    )
      return;
    useSearchFlowStore
      .getState()
      .applySelection({ paradaId: destinoOptions[0].value });
  }, [codInterseccion, paradaId, loadingParadas, destinoOptions]);

  // Resolución inversa: con línea+parada (deep link / favorito) completa
  // calle e intersección para que el formulario quede consistente.
  useEffect(() => {
    const store = useSearchFlowStore.getState();
    if (!codLinea || !paradaId || (codCalle && codInterseccion)) {
      store.setIsResolving(false);
      return;
    }
    let cancelled = false;
    store.setIsResolving(true);
    void (async () => {
      const ubi = await resolveUbicacionFormularioPorParada(codLinea, paradaId);
      if (cancelled) return;
      const s = useSearchFlowStore.getState();
      if (ubi) s.applyResolvedUbicacion(codLinea, paradaId, ubi);
      s.setIsResolving(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [codLinea, paradaId, codCalle, codInterseccion]);

  // Necesita lineas (para detectar líneas manuales) y router: vive acá y no
  // en el store.
  const handleLineaChange = useCallback(
    (v: string) => {
      const line = lineas.find((l) => l.CodigoLineaParada === v);
      if (line?.isManual) {
        router.push(`/recorrido?linea=${encodeURIComponent(v)}`);
        return;
      }
      useSearchFlowStore.getState().selectLinea(v);
    },
    [lineas, router],
  );

  return {
    lineas,
    lineaOptions,
    calles,
    interOptions,
    destinoOptions,
    ramalOptions,
    paradaBanderaAbrevs,
    selectedParada,
    calleLabel,
    interseccionLabel,
    lineaLabel,
    loadingLineas,
    loadingCalles,
    loadingInter,
    loadingParadas,
    handleLineaChange,
  };
}
