"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useArribos } from "@features/arrivals/hooks/useArribos";
import { useOtrasLineasNavigation } from "@features/arrivals/hooks/useOtrasLineasNavigation";
import { useFavoritos } from "@features/favorites/hooks/useFavoritos";
import { useAutoHistorial } from "@features/history/hooks/useAutoHistorial";
import { useHistorial } from "@features/history/hooks/useHistorial";
import { useLiveBuses } from "@features/live-sharing/hooks/useLiveBuses";
import { useOtrasLineas } from "@features/arrivals/hooks/useOtrasLineas";
import { withViewTransition } from "@shared/pwa/viewTransition";
import type { Arribo } from "@features/arrivals/types";
import {
  arriboBanderaLabel,
  arriboLineaDescripcion,
} from "@features/arrivals/utils";
import type { Favorito } from "@features/favorites/types";
import type { HistorialEntry } from "@features/history/types";
import { cn } from "@shared/utils";
import { SearchFlowProvider, useSearchFlowContext } from "@features/search/context/SearchFlowContext";

import { Header } from "@shared/layout/Header";
import { BottomNav } from "@shared/layout/BottomNav";
import { NearStopsSheet } from "@features/search/components/NearStopsSheet";
import { FavoritesList } from "@features/favorites/components/FavoritesList";
import { HistorialList } from "@features/history/components/HistorialList";
import { SearchFlow } from "@features/search/components/SearchFlow";
import { ArrivalsOverlay } from "@features/arrivals/components/ArrivalsOverlay";
import { FavoriteNameModal } from "@features/favorites/components/FavoriteNameModal";
import { ServiceDownModal } from "@shared/ui/ServiceDownModal";
import { PageShell } from "@shared/layout/PageShell";
import { Button } from "@shared/ui/Button";

type NamingState =
  | { open: false }
  | { open: true; mode: "add"; fav: Favorito }
  | { open: true; mode: "edit"; fav: Favorito };

const NAMING_CLOSED: NamingState = { open: false };

export function HomeClient({ children }: { children?: ReactNode }) {
  const [tab, setTab] = useState<"buscar" | "favoritos">("buscar");
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <SearchFlowProvider
      tab={tab}
      setTab={setTab}
      onConsultOpen={() => setSheetOpen(true)}
    >
      <HomeClientContent
        tab={tab}
        setTab={setTab}
        sheetOpen={sheetOpen}
        setSheetOpen={setSheetOpen}
      >
        {children}
      </HomeClientContent>
    </SearchFlowProvider>
  );
}

function HomeClientContent({
  children,
  tab,
  setTab,
  sheetOpen,
  setSheetOpen,
}: {
  children?: ReactNode;
  tab: "buscar" | "favoritos";
  setTab: (tab: "buscar" | "favoritos") => void;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
}) {
  const router = useRouter();
  const { state, actions, meta } = useSearchFlowContext();
  const [showServiceDownModal, setShowServiceDownModal] = useState(false);
  const [nearStopsOpen, setNearStopsOpen] = useState(false);
  const [naming, setNaming] = useState<NamingState>(NAMING_CLOSED);

  const {
    codLinea,
    paradaId,
    selectedRamal,
    isConsulting,
    error,
  } = state;
  const {
    handleSetSelectedRamal,
    setError,
    setIsConsulting,
    applySelection,
    resetToParada,
  } = actions;
  const {
    lineas,
    lineaLabel,
    calleLabel,
    interseccionLabel,
    paradaBanderaAbrevs,
    selectedParada,
  } = meta;

  const { arribos, loadingArribos, mutateArribos, lastUpdate } = useArribos({
    isConsulting,
    paradaId,
    codLinea,
    onSuccess: () => setError(""),
    onError: setError,
  });

  const displayArribos = useMemo(
    () =>
      selectedRamal === "TODOS"
        ? arribos
        : arribos.filter((a) => a.DescripcionBandera === selectedRamal),
    [arribos, selectedRamal],
  );

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

  const { otrasLineas, loadingOtras } = useOtrasLineas({
    isConsulting,
    paradaId,
    codLinea,
    lineas,
  });

  const savedHistRef = useAutoHistorial({
    isConsulting,
    paradaId,
    codLinea,
    arribos,
    lineaLabel,
    calleLabel,
    interseccionLabel,
    pushHistorialEntry,
  });

  const handleSelectOtraLinea = useOtrasLineasNavigation({
    calleLabel,
    interseccionLabel,
    onNavigate: (partial) => applySelection(partial),
    onConsultingChange: setIsConsulting,
  });

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isDismissed = localStorage.getItem("service-down-dismissed") === "true";
    if (isIOS && !isDismissed) setShowServiceDownModal(true);
  }, []);

  const handleCloseServiceDown = useCallback(() => {
    setShowServiceDownModal(false);
    localStorage.setItem("service-down-dismissed", "true");
  }, []);

  useEffect(() => {
    document.body.classList.toggle("arrivals-overlay-open", sheetOpen);
    return () => {
      document.body.classList.remove("arrivals-overlay-open");
    };
  }, [sheetOpen]);

  const handleCloseSheet = useCallback(() => {
    withViewTransition(() => {
      setSheetOpen(false);
      setIsConsulting(false);
    });
  }, [setIsConsulting, setSheetOpen]);

  const handleFavFromArribos = useCallback(
    (arribo: Arribo) => {
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
      isFavoritoEntry,
      removeFavoritoEntry,
      paradaId,
      lineaLabel,
      selectedParada,
      calleLabel,
      interseccionLabel,
    ],
  );

  const handleSaveNaming = useCallback(
    (name: string) => {
      if (!naming.open) return;
      if (naming.mode === "edit") renameFavorito(naming.fav.id, name);
      else addFavorito({ ...naming.fav, nombre: name });
      setNaming(NAMING_CLOSED);
    },
    [addFavorito, naming, renameFavorito],
  );

  const handleEditFavName = useCallback(
    (fav: Favorito) => setNaming({ open: true, mode: "edit", fav }),
    [],
  );

  const fetchFavArribos = useCallback(
    (fav: Favorito) => {
      resetToParada(fav.identificadorParada, fav.codigoLineaParada, {
        consulting: true,
      });
      setSheetOpen(true);
    },
    [resetToParada, setSheetOpen],
  );

  const fetchHistEntry = useCallback(
    (entry: HistorialEntry) => {
      savedHistRef.current = "";
      resetToParada(entry.paradaId, entry.codLinea, { consulting: true });
      setSheetOpen(true);
    },
    [savedHistRef, resetToParada, setSheetOpen],
  );

  const handleNearPickLinea = useCallback(
    (pickedParadaId: string, pickedCodLinea: string) => {
      const line = lineas.find((l) => l.CodigoLineaParada === pickedCodLinea);
      if (line?.isManual) {
        router.push(`/recorrido?linea=${encodeURIComponent(pickedCodLinea)}`);
        return;
      }
      savedHistRef.current = "";
      resetToParada(pickedParadaId, pickedCodLinea, { consulting: true });
      setSheetOpen(true);
    },
    [lineas, router, savedHistRef, resetToParada, setSheetOpen],
  );

  const overlaySession = useMemo(
    () => ({
      consult: {
        codLinea,
        paradaId,
        selectedRamal,
        setSelectedRamal: handleSetSelectedRamal,
        isConsulting,
        lineaLabel,
        calleLabel,
        interseccionLabel,
        selectedParada,
        paradaBanderaAbrevs,
        error,
        setError,
      },
      arrivals: {
        displayArribos,
        loadingArribos,
        lastUpdate,
        fetchArribos: mutateArribos,
        calleLabel,
        interseccionLabel,
        otrasLineas,
        loadingOtras,
        onSelectOtraLinea: handleSelectOtraLinea,
        liveSharings,
        handleFavFromArribos,
      },
      telegramUsername:
        process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "cuandollegamdp_bot",
    }),
    [
      codLinea,
      paradaId,
      selectedRamal,
      handleSetSelectedRamal,
      isConsulting,
      lineaLabel,
      calleLabel,
      interseccionLabel,
      selectedParada,
      paradaBanderaAbrevs,
      error,
      setError,
      displayArribos,
      loadingArribos,
      lastUpdate,
      mutateArribos,
      otrasLineas,
      loadingOtras,
      handleSelectOtraLinea,
      liveSharings,
      handleFavFromArribos,
    ],
  );

  return (
    <div className="flex min-h-pwa-shell flex-col">
      <Header />

      <PageShell>
        {children}
        {tab === "buscar" ? (
          <>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full text-xs font-bold"
                onClick={() => setNearStopsOpen(true)}
              >
                Paradas cerca mío
              </Button>
              <Link
                href="/como-llego"
                className={cn(
                  "btn-pill btn-secondary inline-flex min-h-9 w-full items-center justify-center px-3 text-xs font-bold tracking-tight",
                )}
              >
                Cómo llego
              </Link>
            </div>
            <SearchFlow loadingArribos={loadingArribos} />
          </>
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
          {...overlaySession}
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
        onClose={handleCloseServiceDown}
      />

      <NearStopsSheet
        open={nearStopsOpen}
        onClose={() => setNearStopsOpen(false)}
        onPickLinea={handleNearPickLinea}
      />

      <BottomNav tab={tab} setTab={setTab} favCount={favoritos.length} />
    </div>
  );
}
