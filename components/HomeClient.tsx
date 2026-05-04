"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { post } from "@/lib/api/client";
import { useArribos } from "@/lib/hooks/useArribos";
import { useCalles } from "@/lib/hooks/useCalles";
import { useFavoritos } from "@/lib/hooks/useFavoritos";
import { useHistorial } from "@/lib/hooks/useHistorial";
import { useIntersecciones } from "@/lib/hooks/useIntersecciones";
import { useLineas } from "@/lib/hooks/useLineas";
import { useLiveBuses } from "@/lib/hooks/useLiveBuses";
import { useOtrasLineas } from "@/lib/hooks/useOtrasLineas";
import { useParadas } from "@/lib/hooks/useParadas";
import { useUrlSync } from "@/lib/hooks/useUrlSync";
import { getCache } from "@/lib/storage/localCache";
import type { Arribo, Favorito, HistorialEntry, Linea } from "@/lib/types";
import {
  arriboBanderaLabel,
  arriboLineaDescripcion,
  cleanLabel,
} from "@/lib/utils";

import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { FavoritesList } from "@/components/FavoritesList";
import { HistorialList } from "@/components/HistorialList";
import { SearchFlow } from "@/components/SearchFlow";
import { ArrivalsOverlay } from "@/components/ArrivalsOverlay";
import { FavoriteNameModal } from "@/components/FavoriteNameModal";
import { ServiceDownModal } from "@/components/ServiceDownModal";
import { PageShell } from "@/components/layout";

type RawCalleMatch = { Codigo: string; Descripcion: string };
type RawInterMatch = { Codigo: string; Descripcion: string };
type RawParadaMatch = { Identificador: string };

// ─── Estado de selección agrupado ────────────────────────────────────────────
type Selection = {
  codLinea: string;
  codCalle: string;
  codInterseccion: string;
  paradaId: string;
  selectedRamal: string;
};

const EMPTY_SELECTION: Selection = {
  codLinea: "",
  codCalle: "",
  codInterseccion: "",
  paradaId: "",
  selectedRamal: "TODOS",
};

// ─── Estado del modal de nombre ───────────────────────────────────────────────
type NamingState =
  | { open: false }
  | { open: true; mode: "add"; fav: Favorito }
  | { open: true; mode: "edit"; fav: Favorito };

const NAMING_CLOSED: NamingState = { open: false };

// ─────────────────────────────────────────────────────────────────────────────

export function HomeClient({ children }: { children?: ReactNode }) {
  const [tab, setTab] = useState<"buscar" | "favoritos">("buscar");
  const [showServiceDownModal, setShowServiceDownModal] = useState(true);
  const [sel, setSel] = useState<Selection>(EMPTY_SELECTION);
  const [isConsulting, setIsConsulting] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState("");
  const [naming, setNaming] = useState<NamingState>(NAMING_CLOSED);

  // Desestructuramos para no cambiar las props que reciben los hooks/componentes
  const { codLinea, codCalle, codInterseccion, paradaId, selectedRamal } = sel;

  // Callbacks estables para useUrlSync — inline arrows se recrearían cada render
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
    tab,
    setCodLinea: setUrlCodLinea,
    setParadaId: setUrlParadaId,
    setTab,
    onHydratedSelection: setUrlConsulting,
  });

  // Callback estable para setSelectedRamal — se pasa a SearchFlow y ArrivalsOverlay
  const handleSetSelectedRamal = useCallback(
    (v: string) => setSel((p) => ({ ...p, selectedRamal: v })),
    [],
  );

  const { lineas, loadingLineas } = useLineas({ onError: setError });
  const { callesRaw, loadingCalles } = useCalles(codLinea);
  const { intersecciones, loadingInter } = useIntersecciones(
    codLinea,
    codCalle,
  );
  const { paradas, loadingParadas } = useParadas(
    codLinea,
    codCalle,
    codInterseccion,
  );
  const { arribos, loadingArribos, mutateArribos, lastUpdate } = useArribos({
    isConsulting,
    paradaId,
    codLinea,
    onSuccess: () => setError(""),
    onError: setError,
  });
  const {
    favoritos,
    addFavorito,
    removeFavorito: removeFavoritoEntry,
    renameFavorito,
    isFavorito: isFavoritoEntry,
  } = useFavoritos();
  const {
    historial,
    pushHistorialEntry,
    removeHistorialEntry,
    clearHistorialEntries,
  } = useHistorial();
  const { liveSharings } = useLiveBuses(codLinea);

  // ─── Opciones derivadas ───────────────────────────────────────────────────
  const lineaOptions = useMemo(
    () =>
      lineas.map((l) => ({ value: l.CodigoLineaParada, label: l.Descripcion })),
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

  const displayArribos = useMemo(
    () =>
      selectedRamal === "TODOS"
        ? arribos
        : arribos.filter((a) => a.DescripcionBandera === selectedRamal),
    [arribos, selectedRamal],
  );

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

  const { otrasLineas, loadingOtras } = useOtrasLineas({
    isConsulting,
    paradaId,
    codLinea,
    lineas,
  });

  // ─── Auto-guardado en historial ───────────────────────────────────────────
  const savedHistRef = useRef("");
  useEffect(() => {
    if (!isConsulting || !paradaId || !codLinea || arribos.length === 0) return;
    const entryId = `${paradaId}_${codLinea}`;
    if (savedHistRef.current === entryId) return;
    savedHistRef.current = entryId;
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

  useEffect(() => {
    document.body.classList.toggle("arrivals-overlay-open", sheetOpen);
    return () => {
      document.body.classList.remove("arrivals-overlay-open");
    };
  }, [sheetOpen]);

  // ─── Cascada de auto-selección única ─────────────────────────────────────
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

  // ─── Handlers de selección ────────────────────────────────────────────────
  const handleLineaChange = useCallback((v: string) => {
    setSel({ ...EMPTY_SELECTION, codLinea: v });
    setIsConsulting(false);
  }, []);

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
    setIsConsulting(true);
    setSheetOpen(true);
  }, [paradaId]);

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false);
    setIsConsulting(false);
  }, []);

  // ─── Favoritos ────────────────────────────────────────────────────────────
  const handleFavFromArribos = useCallback(
    (arribo: Arribo) => {
      // FIX: usamos codigoLineaParada del objeto, no split("_") que rompe si contiene "_"
      const id = `${paradaId}_${arribo.CodigoLineaParada}`;
      if (isFavoritoEntry(id)) {
        removeFavoritoEntry(id);
        return;
      }
      const lineaPart =
        arriboLineaDescripcion(arribo) ||
        lineaLabel.trim() ||
        arribo.CodigoLineaParada ||
        "";
      const banderaPart =
        arriboBanderaLabel(arribo) ||
        selectedParada?.AbreviaturaBandera?.trim() ||
        "";
      const ubicacion = [calleLabel, interseccionLabel]
        .filter(Boolean)
        .join(" e ");
      let nombre = "";
      if (lineaPart && banderaPart) nombre = `${lineaPart} — ${banderaPart}`;
      else if (lineaPart) nombre = lineaPart;
      else if (banderaPart) nombre = banderaPart;
      else if (ubicacion) nombre = ubicacion;
      else nombre = "Parada favorita";

      setNaming({
        open: true,
        mode: "add",
        fav: {
          id,
          nombre,
          identificadorParada: paradaId,
          codigoLineaParada: arribo.CodigoLineaParada,
          lineaLabel:
            lineaLabel.trim() ||
            lineaPart ||
            arribo.CodigoLineaParada ||
            undefined,
          descripcionLinea: lineaPart || "—",
          descripcionBandera: banderaPart || "—",
        },
      });
    },
    [
      calleLabel,
      interseccionLabel,
      isFavoritoEntry,
      lineaLabel,
      paradaId,
      removeFavoritoEntry,
      selectedParada,
    ],
  );

  const handleSaveNaming = useCallback(
    (name: string) => {
      if (!naming.open) return;
      if (naming.mode === "edit") {
        renameFavorito(naming.fav.id, name);
      } else {
        addFavorito({ ...naming.fav, nombre: name });
      }
      setNaming(NAMING_CLOSED);
    },
    [addFavorito, naming, renameFavorito],
  );

  const handleEditFavName = useCallback(
    (fav: Favorito) => setNaming({ open: true, mode: "edit", fav }),
    [],
  );

  const fetchFavArribos = useCallback((fav: Favorito) => {
    setTab("buscar");
    // FIX: usamos el campo directo en lugar de split("_")
    setSel({
      ...EMPTY_SELECTION,
      paradaId: fav.identificadorParada,
      codLinea: fav.codigoLineaParada,
    });
    setIsConsulting(true);
    setSheetOpen(true);
  }, []);

  // ─── Otras líneas ─────────────────────────────────────────────────────────
  const handleSelectOtraLinea = useCallback(
    async (linea: Linea) => {
      const currentCalleLabel = calles.find((c) => c.value === codCalle)?.label;
      const currentInterLabel = interOptions.find(
        (i) => i.value === codInterseccion,
      )?.label;
      if (!currentCalleLabel || !currentInterLabel) return;

      setIsConsulting(false);
      setSel({ ...EMPTY_SELECTION, codLinea: linea.CodigoLineaParada });

      try {
        let nuevasCalles = getCache<RawCalleMatch[]>(
          "RecuperarCallesPrincipalPorLinea",
          {
            codLinea: linea.CodigoLineaParada,
          },
        );
        if (!nuevasCalles) {
          const res = await post("RecuperarCallesPrincipalPorLinea", {
            codLinea: linea.CodigoLineaParada,
          });
          nuevasCalles = res?.calles ?? [];
        }

        const matchCalle = (nuevasCalles ?? []).find(
          (c: RawCalleMatch) =>
            c.Descripcion &&
            (c.Descripcion.includes(currentCalleLabel) ||
              currentCalleLabel.includes(c.Descripcion)),
        );
        if (!matchCalle) return;
        setSel((p) => ({ ...p, codCalle: matchCalle.Codigo }));

        let nuevasInter = getCache<RawInterMatch[]>(
          "RecuperarInterseccionPorLineaYCalle",
          { codLinea: linea.CodigoLineaParada, codCalle: matchCalle.Codigo },
        );
        if (!nuevasInter) {
          const res = await post("RecuperarInterseccionPorLineaYCalle", {
            codLinea: linea.CodigoLineaParada,
            codCalle: matchCalle.Codigo,
          });
          nuevasInter = res?.calles ?? [];
        }

        const matchInter = (nuevasInter ?? []).find(
          (i: RawInterMatch) =>
            i.Descripcion &&
            (i.Descripcion.includes(currentInterLabel) ||
              currentInterLabel.includes(i.Descripcion)),
        );
        if (!matchInter) return;
        setSel((p) => ({ ...p, codInterseccion: matchInter.Codigo }));

        const resParadas = await post(
          "RecuperarParadasConBanderaPorLineaCalleEInterseccion",
          {
            codLinea: linea.CodigoLineaParada,
            codCalle: matchCalle.Codigo,
            codInterseccion: matchInter.Codigo,
          },
        );
        const nParadas: RawParadaMatch[] = resParadas?.paradas ?? [];
        if (nParadas.length > 0) {
          setSel((p) => ({ ...p, paradaId: nParadas[0].Identificador }));
          setIsConsulting(true);
        }
      } catch (err) {
        console.error(err);
      }
    },
    [codCalle, codInterseccion, calles, interOptions],
  );

  // ─── Historial ────────────────────────────────────────────────────────────
  const fetchHistEntry = useCallback((entry: HistorialEntry) => {
    setTab("buscar");
    setSel({
      ...EMPTY_SELECTION,
      paradaId: entry.paradaId,
      codLinea: entry.codLinea,
    });
    savedHistRef.current = "";
    setIsConsulting(true);
    setSheetOpen(true);
  }, []);

  return (
    <div className="flex min-h-pwa-shell flex-col">
      <Header />

      <PageShell>
        {children}
        {tab === "buscar" ? (
          <SearchFlow
            codLinea={codLinea}
            setCodLinea={handleLineaChange}
            codCalle={codCalle}
            setCodCalle={handleCalleChange}
            codInterseccion={codInterseccion}
            setCodInterseccion={handleInterseccionChange}
            paradaId={paradaId}
            setParadaId={handleParadaChange}
            selectedRamal={selectedRamal}
            setSelectedRamal={handleSetSelectedRamal}
            isConsulting={isConsulting}
            lineaOptions={lineaOptions}
            calles={calles}
            interOptions={interOptions}
            destinoOptions={destinoOptions}
            ramalOptions={ramalOptions}
            loadingLineas={loadingLineas}
            loadingCalles={loadingCalles}
            loadingInter={loadingInter}
            loadingArribos={loadingArribos}
            error={error}
            setError={setError}
            handleConsultar={handleConsultar}
          />
        ) : (
          <>
            <FavoritesList
              favoritos={favoritos}
              onView={fetchFavArribos}
              onRemove={removeFavoritoEntry}
              onRename={handleEditFavName}
              onGoToSearch={() => setTab("buscar")}
            />
            <HistorialList
              historial={historial}
              onView={fetchHistEntry}
              onRemove={removeHistorialEntry}
              onClear={clearHistorialEntries}
            />
          </>
        )}
      </PageShell>

      {sheetOpen && (
        <ArrivalsOverlay
          isOpen={sheetOpen}
          onClose={handleCloseSheet}
          codLinea={codLinea}
          paradaId={paradaId}
          selectedRamal={selectedRamal}
          setSelectedRamal={handleSetSelectedRamal}
          isConsulting={isConsulting}
          loadingArribos={loadingArribos}
          lineaLabel={lineaLabel} // ← nuevo
          displayArribos={displayArribos}
          paradaBanderaAbrevs={paradaBanderaAbrevs}
          selectedParada={selectedParada}
          lastUpdate={lastUpdate}
          fetchArribos={mutateArribos}
          calleLabel={calleLabel}
          interseccionLabel={interseccionLabel}
          handleFavFromArribos={handleFavFromArribos}
          otrasLineas={otrasLineas}
          loadingOtras={loadingOtras}
          onSelectOtraLinea={handleSelectOtraLinea}
          liveSharings={liveSharings}
          telegramUsername={
            process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
            "cuandollegamdp_bot"
          }
          error={error}
          setError={setError}
        />
      )}

      <FavoriteNameModal
        isOpen={naming.open}
        onClose={() => setNaming(NAMING_CLOSED)}
        onSave={handleSaveNaming}
        initialName={naming.open ? naming.fav.nombre : ""}
        title={
          naming.open && naming.mode === "edit"
            ? "Renombrar parada"
            : "Guardar parada"
        }
      />

      <ServiceDownModal
        isOpen={tab === "buscar" && showServiceDownModal}
        onClose={() => setShowServiceDownModal(false)}
      />

      <BottomNav tab={tab} setTab={setTab} favCount={favoritos.length} />
    </div>
  );
}
