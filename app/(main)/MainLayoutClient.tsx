"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Header } from "@shared/layout/Header";
import { BottomNav } from "@shared/layout/BottomNav";
import { SearchFlowProvider, useSearchFlowContext } from "@features/search/context/SearchFlowContext";
import { useArribos } from "@features/arrivals/hooks/useArribos";
import { useFavoritos } from "@features/favorites/hooks/useFavoritos";
import { useHistorial } from "@features/history/hooks/useHistorial";
import { useAutoHistorial } from "@features/history/hooks/useAutoHistorial";
import { useLiveBuses } from "@features/live-sharing/hooks/useLiveBuses";
import { useOtrasLineas } from "@features/arrivals/hooks/useOtrasLineas";
import { useOtrasLineasNavigation } from "@features/arrivals/hooks/useOtrasLineasNavigation";
import { ArrivalsOverlay } from "@features/arrivals/components/ArrivalsOverlay";
import { FavoriteNameModal } from "@features/favorites/components/FavoriteNameModal";
import { ServiceDownModal } from "@shared/ui/ServiceDownModal";
import { withViewTransition } from "@shared/pwa/viewTransition";
import type { Arribo } from "@features/arrivals/types";
import type { Favorito } from "@features/favorites/types";

type NamingState =
  | { open: false }
  | { open: true; mode: "add"; fav: Favorito }
  | { open: true; mode: "edit"; fav: Favorito };

const NAMING_CLOSED: NamingState = { open: false };

export function MainLayoutClient({ children }: { children: ReactNode }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  return (
    <SearchFlowProvider onConsultOpen={() => setSheetOpen(true)}>
      <MainLayoutContent sheetOpen={sheetOpen} setSheetOpen={setSheetOpen}>
        {children}
      </MainLayoutContent>
    </SearchFlowProvider>
  );
}

function MainLayoutContent({
  children,
  sheetOpen,
  setSheetOpen,
}: {
  children: ReactNode;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
}) {
  const { state, actions, meta } = useSearchFlowContext();
  const [naming, setNaming] = useState<NamingState>(NAMING_CLOSED);
  const [showServiceDownModal, setShowServiceDownModal] = useState(false);

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
    pushHistorialEntry,
  } = useHistorial();

  const { liveSharings } = useLiveBuses(codLinea);

  const { otrasLineas, loadingOtras } = useOtrasLineas({
    isConsulting,
    paradaId,
    codLinea,
    lineas,
  });

  useAutoHistorial({
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

  // Ensure sheetOpen matches isConsulting (e.g. on URL hydration)
  useEffect(() => {
    if (isConsulting && !sheetOpen) {
      setSheetOpen(true);
    } else if (!isConsulting && sheetOpen) {
      setSheetOpen(false);
    }
  }, [isConsulting, sheetOpen, setSheetOpen]);

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

  const isCurrentFavorito = useMemo(() => {
    const targetId = `${paradaId}_${codLinea}`;
    return favoritos.some(f => f.id === targetId);
  }, [favoritos, paradaId, codLinea]);

  const handleToggleFavCurrent = useCallback(() => {
    const id = `${paradaId}_${codLinea}`;
    if (isFavoritoEntry(id)) {
      removeFavoritoEntry(id);
      return;
    }
    
    const lineaPart = lineaLabel.trim() || codLinea || "";
    const banderaPart = selectedParada?.AbreviaturaBandera?.trim() || "";
    const ubicacion = [calleLabel, interseccionLabel]
        .filter(Boolean)
        .join(" y ");
        
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
            codigoLineaParada: codLinea,
            lineaLabel: lineaLabel.trim() || lineaPart || codLinea || undefined,
            descripcionLinea: lineaPart || "—",
            descripcionBandera: banderaPart || "—",
            calleLabel,
            interseccionLabel,
        },
    });
  }, [
    codLinea,
    paradaId,
    isFavoritoEntry,
    removeFavoritoEntry,
    lineaLabel,
    selectedParada,
    calleLabel,
    interseccionLabel,
  ]);

  const handleSaveNaming = useCallback(
    (name: string) => {
      if (!naming.open) return;
      if (naming.mode === "edit") renameFavorito(naming.fav.id, name);
      else addFavorito({ ...naming.fav, nombre: name });
      setNaming(NAMING_CLOSED);
    },
    [addFavorito, naming, renameFavorito],
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
        handleToggleFavCurrent,
        isCurrentFavorito,
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
      handleToggleFavCurrent,
      isCurrentFavorito,
    ],
  );

  return (
    <div className="flex min-h-pwa-shell flex-col">
      <Header />
      {children}
      <BottomNav />

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
        isOpen={showServiceDownModal}
        onClose={handleCloseServiceDown}
      />
    </div>
  );
}
