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
import { useSearchFlow } from "@/app/hooks/useSearchFlow";

import { Header } from "@shared/layout/Header";
import { BottomNav } from "@shared/layout/BottomNav";
import { NearStopsSheet } from "@features/search/components/NearStopsSheet";
import { FavoritesList } from "@features/favorites/components/FavoritesList";
import { HistorialList } from "@features/history/components/HistorialList";
import { SearchFlow } from "@features/search/components/SearchFlow";
import { ArrivalsOverlay } from "@features/arrivals/components/ArrivalsOverlay";
import { FavoriteNameModal } from "@features/favorites/components/FavoriteNameModal";
import { ServiceDownModal } from "@shared/ui/ServiceDownModal";
import { PageShell } from "@shared/layout";
import { Button } from "@shared/ui";

type NamingState =
  | { open: false }
  | { open: true; mode: "add"; fav: Favorito }
  | { open: true; mode: "edit"; fav: Favorito };

const NAMING_CLOSED: NamingState = { open: false };

export function HomeClient({ children }: { children?: ReactNode }) {
  const router = useRouter();
  const [tab, setTab] = useState<"buscar" | "favoritos">("buscar");
  const [showServiceDownModal, setShowServiceDownModal] = useState(false);
  const [nearStopsOpen, setNearStopsOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [naming, setNaming] = useState<NamingState>(NAMING_CLOSED);

  const search = useSearchFlow({
    tab,
    setTab,
    onConsultOpen: () => setSheetOpen(true),
  });

  const { arribos, loadingArribos, mutateArribos, lastUpdate } = useArribos({
    isConsulting: search.isConsulting,
    paradaId: search.paradaId,
    codLinea: search.codLinea,
    onSuccess: () => search.setError(""),
    onError: search.setError,
  });

  const displayArribos = useMemo(
    () =>
      search.selectedRamal === "TODOS"
        ? arribos
        : arribos.filter((a) => a.DescripcionBandera === search.selectedRamal),
    [arribos, search.selectedRamal],
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
  const { liveSharings } = useLiveBuses(search.codLinea);

  const { otrasLineas, loadingOtras } = useOtrasLineas({
    isConsulting: search.isConsulting,
    paradaId: search.paradaId,
    codLinea: search.codLinea,
    lineas: search.lineas,
  });

  const savedHistRef = useAutoHistorial({
    isConsulting: search.isConsulting,
    paradaId: search.paradaId,
    codLinea: search.codLinea,
    arribos,
    lineaLabel: search.lineaLabel,
    calleLabel: search.calleLabel,
    interseccionLabel: search.interseccionLabel,
    pushHistorialEntry,
  });

  const handleSelectOtraLinea = useOtrasLineasNavigation({
    calleLabel: search.calleLabel,
    interseccionLabel: search.interseccionLabel,
    onNavigate: (partial) => search.applySelection(partial),
    onConsultingChange: search.setIsConsulting,
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
      search.setIsConsulting(false);
    });
  }, [search]);

  const handleFavFromArribos = useCallback(
    (arribo: Arribo) => {
      const id = `${search.paradaId}_${arribo.CodigoLineaParada}`;
      if (isFavoritoEntry(id)) {
        removeFavoritoEntry(id);
        return;
      }
      const lineaPart =
        arriboLineaDescripcion(arribo) ||
        search.lineaLabel.trim() ||
        arribo.CodigoLineaParada ||
        "";
      const banderaPart =
        arriboBanderaLabel(arribo) ||
        search.selectedParada?.AbreviaturaBandera?.trim() ||
        "";
      const ubicacion = [search.calleLabel, search.interseccionLabel]
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
          identificadorParada: search.paradaId,
          codigoLineaParada: arribo.CodigoLineaParada,
          lineaLabel:
            search.lineaLabel.trim() ||
            lineaPart ||
            arribo.CodigoLineaParada ||
            undefined,
          descripcionLinea: lineaPart || "—",
          descripcionBandera: banderaPart || "—",
        },
      });
    },
    [isFavoritoEntry, removeFavoritoEntry, search],
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
      search.resetToParada(fav.identificadorParada, fav.codigoLineaParada, {
        consulting: true,
      });
      setSheetOpen(true);
    },
    [search],
  );

  const fetchHistEntry = useCallback(
    (entry: HistorialEntry) => {
      savedHistRef.current = "";
      search.resetToParada(entry.paradaId, entry.codLinea, { consulting: true });
      setSheetOpen(true);
    },
    [savedHistRef, search],
  );

  const handleNearPickLinea = useCallback(
    (paradaId: string, codLinea: string) => {
      const line = search.lineas.find((l) => l.CodigoLineaParada === codLinea);
      if (line?.isManual) {
        router.push(`/recorrido?linea=${encodeURIComponent(codLinea)}`);
        return;
      }
      savedHistRef.current = "";
      search.resetToParada(paradaId, codLinea, { consulting: true });
      setSheetOpen(true);
    },
    [router, savedHistRef, search],
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
            <SearchFlow
              codLinea={search.codLinea}
              setCodLinea={search.handleLineaChange}
              codCalle={search.codCalle}
              setCodCalle={search.handleCalleChange}
              codInterseccion={search.codInterseccion}
              setCodInterseccion={search.handleInterseccionChange}
              paradaId={search.paradaId}
              setParadaId={search.handleParadaChange}
              selectedRamal={search.selectedRamal}
              setSelectedRamal={search.handleSetSelectedRamal}
              isConsulting={search.isConsulting}
              lineaOptions={search.lineaOptions}
              calles={search.calles}
              interOptions={search.interOptions}
              destinoOptions={search.destinoOptions}
              ramalOptions={search.ramalOptions}
              loadingLineas={search.loadingLineas}
              loadingCalles={search.loadingCalles}
              loadingInter={search.loadingInter}
              loadingArribos={loadingArribos}
              error={search.error}
              setError={search.setError}
              handleConsultar={search.handleConsultar}
            />
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
          codLinea={search.codLinea}
          paradaId={search.paradaId}
          selectedRamal={search.selectedRamal}
          setSelectedRamal={search.handleSetSelectedRamal}
          isConsulting={search.isConsulting}
          loadingArribos={loadingArribos}
          lineaLabel={search.lineaLabel}
          displayArribos={displayArribos}
          paradaBanderaAbrevs={search.paradaBanderaAbrevs}
          selectedParada={search.selectedParada}
          lastUpdate={lastUpdate}
          fetchArribos={mutateArribos}
          calleLabel={search.calleLabel}
          interseccionLabel={search.interseccionLabel}
          handleFavFromArribos={handleFavFromArribos}
          otrasLineas={otrasLineas}
          loadingOtras={loadingOtras}
          onSelectOtraLinea={handleSelectOtraLinea}
          liveSharings={liveSharings}
          telegramUsername={
            process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
            "cuandollegamdp_bot"
          }
          error={search.error}
          setError={search.setError}
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
