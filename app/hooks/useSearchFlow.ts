"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveUbicacionFormularioPorParada } from "@features/search/api/resolveUbicacion";
import { useCalles } from "@features/search/hooks/useCalles";
import { useIntersecciones } from "@features/search/hooks/useIntersecciones";
import { useLineas } from "@features/search/hooks/useLineas";
import { useParadas } from "@features/search/hooks/useParadas";
import { useUrlSync } from "@shared/hooks/useUrlSync";
import { withViewTransition } from "@shared/pwa/viewTransition";
import { cleanLabel } from "@shared/utils";

export type Selection = {
  codLinea: string;
  codCalle: string;
  codInterseccion: string;
  paradaId: string;
  selectedRamal: string;
};

export const EMPTY_SELECTION: Selection = {
  codLinea: "",
  codCalle: "",
  codInterseccion: "",
  paradaId: "",
  selectedRamal: "TODOS",
};

interface UseSearchFlowParams {
  onConsultOpen?: () => void;
}

export function useSearchFlow({
  onConsultOpen,
}: UseSearchFlowParams = {}) {
  const router = useRouter();
  const [sel, setSel] = useState<Selection>(EMPTY_SELECTION);
  const [isConsulting, setIsConsulting] = useState(false);
  const [error, setError] = useState("");

  const { codLinea, codCalle, codInterseccion, paradaId, selectedRamal } = sel;

  const setUrlCodLinea = useCallback(
    (v: string) => setSel({ ...EMPTY_SELECTION, codLinea: v }),
    [],
  );
  const setUrlParadaId = useCallback(
    (v: string) => setSel((p) => ({ ...p, paradaId: v })),
    [],
  );
  const setUrlConsulting = useCallback(() => setIsConsulting(true), []);

  useUrlSync({
    codLinea,
    paradaId,
    setCodLinea: setUrlCodLinea,
    setParadaId: setUrlParadaId,
    onHydratedSelection: setUrlConsulting,
  });

  const handleSetSelectedRamal = useCallback(
    (v: string) => setSel((p) => ({ ...p, selectedRamal: v })),
    [],
  );

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

  useEffect(() => {
    if (!codLinea || codCalle || loadingCalles || calles.length !== 1) return;
    setSel((p) => ({ ...p, codCalle: calles[0].value }));
  }, [codLinea, codCalle, loadingCalles, calles]);

  useEffect(() => {
    if (
      !codCalle ||
      codInterseccion ||
      loadingInter ||
      interOptions.length !== 1
    )
      return;
    setSel((p) => ({ ...p, codInterseccion: interOptions[0].value }));
  }, [codCalle, codInterseccion, loadingInter, interOptions]);

  useEffect(() => {
    if (
      !codInterseccion ||
      paradaId ||
      loadingParadas ||
      destinoOptions.length !== 1
    )
      return;
    setSel((p) => ({ ...p, paradaId: destinoOptions[0].value }));
  }, [codInterseccion, paradaId, loadingParadas, destinoOptions]);

  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!codLinea || !paradaId || (codCalle && codInterseccion)) {
      setIsResolving(false);
      return;
    }
    let cancelled = false;
    setIsResolving(true);
    void (async () => {
      const ubi = await resolveUbicacionFormularioPorParada(codLinea, paradaId);
      if (cancelled) return;
      if (!ubi) {
        setIsResolving(false);
        return;
      }
      setSel((p) => {
        if (p.codLinea !== codLinea || p.paradaId !== paradaId) return p;
        if (p.codCalle && p.codInterseccion) return p;
        return {
          ...p,
          codCalle: ubi.codCalle,
          codInterseccion: ubi.codInterseccion,
        };
      });
      setIsResolving(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [codLinea, paradaId, codCalle, codInterseccion]);

  const handleLineaChange = useCallback(
    (v: string) => {
      const line = lineas.find((l) => l.CodigoLineaParada === v);
      if (line?.isManual) {
        router.push(`/recorrido?linea=${encodeURIComponent(v)}`);
        return;
      }
      setSel({ ...EMPTY_SELECTION, codLinea: v });
      setIsConsulting(false);
    },
    [lineas, router],
  );

  const handleCalleChange = useCallback((v: string) => {
    setSel((p) => ({ ...EMPTY_SELECTION, codLinea: p.codLinea, codCalle: v }));
    setIsConsulting(false);
  }, []);

  const handleInterseccionChange = useCallback((v: string) => {
    setSel((p) => ({
      ...EMPTY_SELECTION,
      codLinea: p.codLinea,
      codCalle: p.codCalle,
      codInterseccion: v,
    }));
    setIsConsulting(false);
  }, []);

  const handleParadaChange = useCallback((v: string) => {
    setSel((p) => ({ ...p, paradaId: v, selectedRamal: "TODOS" }));
    setIsConsulting(false);
  }, []);

  const handleConsultar = useCallback(() => {
    if (!paradaId) return;
    withViewTransition(() => {
      setIsConsulting(true);
      onConsultOpen?.();
    });
  }, [onConsultOpen, paradaId]);

  const applySelection = useCallback(
    (partial: Partial<Selection>, options?: { consulting?: boolean }) => {
      setSel((p) => ({ ...p, ...partial }));
      if (options?.consulting !== undefined) {
        setIsConsulting(options.consulting);
      }
    },
    [],
  );

  const resetToParada = useCallback(
    (parada: string, linea: string, options?: { consulting?: boolean }) => {
      withViewTransition(() => {
        setSel({
          ...EMPTY_SELECTION,
          paradaId: parada,
          codLinea: linea,
        });
        if (options?.consulting) setIsConsulting(true);
      });
    },
    [],
  );

  return {
    sel,
    setSel,
    codLinea,
    codCalle,
    codInterseccion,
    paradaId,
    selectedRamal,
    isConsulting,
    isResolving,
    setIsConsulting,
    error,
    setError,
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
    handleSetSelectedRamal,
    handleLineaChange,
    handleCalleChange,
    handleInterseccionChange,
    handleParadaChange,
    handleConsultar,
    applySelection,
    resetToParada,
  };
}
