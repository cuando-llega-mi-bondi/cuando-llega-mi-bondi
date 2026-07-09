"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@shared/layout/Header";
import { BottomNav } from "@shared/layout/BottomNav";
import { SearchFlowProvider, useSearchFlowData } from "@features/search/context/SearchFlowContext";
import { useSearchFlowStore } from "@features/search/store/useSearchFlowStore";
import { useArribos } from "@features/arrivals/hooks/useArribos";
import { useFavoritos } from "@features/favorites/hooks/useFavoritos";
import { useHistorial } from "@features/history/hooks/useHistorial";
import { useAutoHistorial } from "@features/history/hooks/useAutoHistorial";
import { useLiveBuses } from "@features/live-sharing/hooks/useLiveBuses";
import { useOtrasLineas } from "@features/arrivals/hooks/useOtrasLineas";
import { useOtrasLineasNavigation } from "@features/arrivals/hooks/useOtrasLineasNavigation";
import { ArrivalsOverlay } from "@features/arrivals/components/ArrivalsOverlay";
import { ArrivalsSessionProvider } from "@features/arrivals/context/ArrivalsSessionContext";
import { useIsDesktop } from "@shared/hooks/useIsDesktop";
import { FavoriteNameModal } from "@features/favorites/components/FavoriteNameModal";
import { withViewTransition } from "@shared/pwa/viewTransition";
import { useUIStore, NAMING_CLOSED } from "@shared/ui/store/useUIStore";
import { toast } from "@shared/ui/store/useToastStore";

export function MainLayoutClient({ children }: { children: ReactNode }) {
  return (
    <SearchFlowProvider>
      <MainLayoutContent>
        {children}
      </MainLayoutContent>
    </SearchFlowProvider>
  );
}

function MainLayoutContent({ children }: { children: ReactNode }) {
  const {
    lineas,
    lineaLabel,
    calleLabel,
    interseccionLabel,
    paradaBanderaAbrevs,
    selectedParada,
  } = useSearchFlowData();
  const { sheetOpen, setSheetOpen, namingModal: naming, setNamingModal: setNaming } = useUIStore();

  // En desktop, /consultar tiene su propio pane con mapa + panel embebidos: ahí
  // el overlay global no se monta (un solo mapa a la vez) ni se lockea el scroll.
  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const consultarPaneActive = isDesktop && pathname === "/consultar";

  const codLinea = useSearchFlowStore((s) => s.codLinea);
  const paradaId = useSearchFlowStore((s) => s.paradaId);
  const selectedRamal = useSearchFlowStore((s) => s.selectedRamal);
  const isConsulting = useSearchFlowStore((s) => s.isConsulting);
  const error = useSearchFlowStore((s) => s.error);

  const handleSetSelectedRamal = useSearchFlowStore((s) => s.setSelectedRamal);
  const setError = useSearchFlowStore((s) => s.setError);
  const setIsConsulting = useSearchFlowStore((s) => s.setIsConsulting);
  const applySelection = useSearchFlowStore((s) => s.applySelection);

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
    addFavorito,
    renameFavorito,
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
    document.body.classList.toggle(
      "arrivals-overlay-open",
      sheetOpen && !consultarPaneActive,
    );
    return () => {
      document.body.classList.remove("arrivals-overlay-open");
    };
  }, [sheetOpen, consultarPaneActive]);

  const handleCloseSheet = useCallback(() => {
    withViewTransition(() => {
      setSheetOpen(false);
      setIsConsulting(false);
    });
  }, [setIsConsulting, setSheetOpen]);

  const handleSaveNaming = useCallback(
    (name: string) => {
      if (!naming.open) return;
      if (naming.mode === "edit") {
        renameFavorito(naming.fav.id, name);
        toast({ description: "Favorito renombrado." });
      } else {
        addFavorito({ ...naming.fav, nombre: name });
        toast({ description: "Guardado en favoritos." });
      }
      setNaming(NAMING_CLOSED);
    },
    [addFavorito, naming, renameFavorito, setNaming],
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
    ],
  );

  const sessionValue = useMemo(
    () => ({ session: overlaySession, closeConsult: handleCloseSheet }),
    [overlaySession, handleCloseSheet],
  );

  return (
    <ArrivalsSessionProvider value={sessionValue}>
    <div className="flex min-h-pwa-shell flex-col lg:pl-60">
      <Header />
      {children}
      <BottomNav />

      {sheetOpen && !consultarPaneActive ? (
        <ArrivalsOverlay
          isOpen={sheetOpen}
          onClose={handleCloseSheet}
          {...overlaySession}
        />
      ) : null}

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

    </div>
    </ArrivalsSessionProvider>
  );
}
