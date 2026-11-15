"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header } from "@shared/layout/Header";
import { BottomNav, EmbeddedBottomNav } from "@shared/layout/BottomNav";
import { ThemeToggle } from "@shared/layout/ThemeToggle";
import { PlayStoreNavLink } from "@shared/layout/PlayStoreNavLink";
import { Footer } from "@shared/layout/Footer";
import { IconBus } from "@shared/icons/IconBus";
import { BrandLogo } from "@shared/ui/BrandLogo";
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
import { LandingHero } from "@features/landing/components/LandingHero";
import { LandingAward } from "@features/landing/components/LandingAward";
import { LandingFeatures } from "@features/landing/components/LandingFeatures";
import { LandingStats } from "@features/landing/components/LandingStats";
import { LandingTestimonials } from "@features/landing/components/LandingTestimonials";
import { SocialTestimonials } from "@features/landing/components/SocialTestimonials";
import { LandingAuthors } from "@features/landing/components/LandingAuthors";
import { LandingSponsors } from "@features/landing/components/LandingSponsors";
import { LandingFaq } from "@features/landing/components/LandingFaq";
import { LandingCta } from "@features/landing/components/LandingCta";
import { LandingMotionConfig } from "@features/landing/components/LandingMotionConfig";

function getSectionTitle(pathname: string): string {
  if (pathname.startsWith("/favoritos")) return "Favoritos";
  if (pathname.startsWith("/recorrido")) return "Reseñas y recorridos";
  if (pathname.startsWith("/acerca")) return "Acerca de";
  if (pathname.startsWith("/paradas-cerca")) return "Paradas cerca mío";
  if (pathname.startsWith("/como-llego")) return "Cómo llego";
  if (pathname.startsWith("/perfil")) return "Tu cuenta";
  return "Consultar arribos";
}

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

  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const isFullBleedPhoneRoute =
    pathname.startsWith("/recorrido") ||
    pathname.startsWith("/paradas-cerca") ||
    pathname.startsWith("/como-llego");

  const codLinea = useSearchFlowStore((s) => s.codLinea);
  const paradaId = useSearchFlowStore((s) => s.paradaId);
  const selectedRamal = useSearchFlowStore((s) => s.selectedRamal);
  const isConsulting = useSearchFlowStore((s) => s.isConsulting);
  const error = useSearchFlowStore((s) => s.error);

  const handleSetSelectedRamal = useSearchFlowStore((s) => s.setSelectedRamal);
  const setError = useSearchFlowStore((s) => s.setError);
  const setIsConsulting = useSearchFlowStore((s) => s.setIsConsulting);
  const applySelection = useSearchFlowStore((s) => s.applySelection);

  const { arribos, loadingArribos, mutateArribos, lastUpdate, errorInfo, retryAt, isStale } = useArribos({
    isConsulting,
    paradaId,
    codLinea,
    onSuccess: () => setError(""),
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

  // Solo bloqueamos el scroll del body en mobile (<lg); en desktop el overlay
  // vive contenido dentro del teléfono (#phone-viewport) mientras la landing sigue scrolleable.
  useEffect(() => {
    document.body.classList.toggle(
      "arrivals-overlay-open",
      sheetOpen && !isDesktop,
    );
    return () => {
      document.body.classList.remove("arrivals-overlay-open");
    };
  }, [sheetOpen, isDesktop]);

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
        errorInfo,
        retryAt,
        isStale,
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
      errorInfo,
      retryAt,
      isStale,
    ],
  );

  const sessionValue = useMemo(
    () => ({ session: overlaySession, closeConsult: handleCloseSheet }),
    [overlaySession, handleCloseSheet],
  );

  const sectionTitle = getSectionTitle(pathname);

  return (
    <ArrivalsSessionProvider value={sessionValue}>
      <div className="flex min-h-pwa-shell flex-col bg-background text-foreground lg:flex-row">
        {!isFullBleedPhoneRoute ? <Header /> : null}

        {/* Columna izquierda: toda la app interactiva pasa por acá (full-width en mobile <lg; teléfono fijo estilo Paisanos en desktop ≥lg) */}
        <aside
          id="consultar-panel"
          aria-label="Aplicación interactiva Bondi MDP"
          className="mx-auto flex w-full max-w-[520px] flex-1 flex-col lg:sticky lg:top-0 lg:z-40 lg:mx-0 lg:h-dvh lg:w-[400px] lg:max-w-none lg:flex-none lg:shrink-0 lg:py-5 lg:pl-6 lg:pr-2 xl:w-[420px]"
        >
          {/* Marca superior sobre el teléfono (solo desktop, estilo Paisanos) */}
          <div className="hidden lg:mb-3.5 lg:flex lg:shrink-0 lg:items-center lg:justify-between lg:px-1">
            <Link
              href="/"
              aria-label="Bondi MDP — Ir al inicio"
              className="flex min-h-11 items-center gap-2.5 text-foreground transition-opacity hover:opacity-80"
            >
              <IconBus />
              <BrandLogo size="sm" />
            </Link>
            <div className="flex items-center gap-2">
              <PlayStoreNavLink />
              <ThemeToggle />
            </div>
          </div>

          {/* Chasis del teléfono en desktop; contenedor directo en mobile */}
          <div className="flex flex-1 flex-col lg:min-h-0 lg:overflow-hidden lg:rounded-[28px] lg:border lg:border-border lg:bg-card lg:shadow-xl">
            <div
              aria-hidden
              className="mx-auto mt-2.5 hidden h-1 w-10 shrink-0 rounded-full bg-border lg:block"
            />

            <div className="hidden lg:flex lg:shrink-0 lg:items-center lg:justify-between lg:border-b lg:border-border/70 lg:px-5 lg:pt-2.5 lg:pb-3">
              <div>
                <span className="block text-xs font-medium text-muted-foreground">
                  Sección
                </span>
                <span className="font-display text-lg font-bold tracking-tight text-foreground">
                  {sectionTitle}
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
                Vivo
              </span>
            </div>

            {/* Viewport del teléfono: transform crea containing block en desktop para que fixed/sheets queden contenidos acá adentro */}
            <div
              id="phone-viewport"
              className="relative flex min-h-0 flex-1 flex-col lg:overflow-hidden lg:[transform:translateZ(0)]"
            >
              {isFullBleedPhoneRoute ? (
                <div className="flex min-h-0 flex-1 flex-col pb-nav lg:no-scrollbar lg:overflow-y-auto lg:pb-0">
                  {children}
                </div>
              ) : (
                <div className="flex-1 px-[calc(20px+var(--safe-left))] pr-[calc(20px+var(--safe-right))] pt-5 pb-nav lg:no-scrollbar lg:overflow-y-auto lg:px-4 lg:py-4">
                  {children}
                  <div className="mt-10 lg:hidden">
                    <Footer />
                  </div>
                </div>
              )}

              {sheetOpen ? (
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

            <EmbeddedBottomNav />
          </div>
        </aside>

        {/* Lienzo derecho: Landing persistente en desktop (independiente de la sección que se navegue en el teléfono; oculta en mobile) */}
        <main
          id="conoce-mas"
          className="hidden min-w-0 flex-1 lg:block lg:px-6 lg:py-5 lg:pb-10 xl:px-8"
        >
          <LandingMotionConfig>
            <div>
              {/* Media separación: la sección siguiente centra su título en pantalla y ya trae aire propio */}
              <div className="pb-10 xl:pb-12">
                <LandingHero />
              </div>
              {/* Primero las pruebas (premio y cifras), después el producto, las voces
                  de afuera, quién lo sostiene y quién lo hace; cierran dudas y el CTA */}
              <LandingAward />
              <LandingStats />
              <LandingFeatures />
              <LandingTestimonials />
              <SocialTestimonials />
              <LandingSponsors />
              <LandingAuthors />
              <LandingFaq />
              <LandingCta />
              <p className="px-6 pb-2 text-center text-xs text-muted-foreground">
                Cartografía base © OpenStreetMap contributors · Datos de arribos MGP
              </p>
            </div>
          </LandingMotionConfig>

          <Footer />
        </main>

        <BottomNav hideSideNav />
      </div>
    </ArrivalsSessionProvider>
  );
}
