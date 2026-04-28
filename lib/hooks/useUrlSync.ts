"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface UseUrlSyncParams {
  codLinea: string;
  paradaId: string;
  tab?: "buscar" | "favoritos";
  setCodLinea: (value: string) => void;
  setParadaId: (value: string) => void;
  setTab?: (value: "buscar" | "favoritos") => void;
  onHydratedSelection?: () => void;
}

export function useUrlSync({
  codLinea,
  paradaId,
  tab,
  setCodLinea,
  setParadaId,
  setTab,
  onHydratedSelection,
}: UseUrlSyncParams) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hydrated = useRef(false);
  const skipUrlSync = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const urlLinea = searchParams.get("linea");
    const urlParada = searchParams.get("parada");
    const urlTab = searchParams.get("tab");

    if (urlLinea && urlParada) {
      skipUrlSync.current = true;
      setCodLinea(urlLinea);
      setParadaId(urlParada);
      onHydratedSelection?.();
    }

    if (urlTab && setTab && (urlTab === "buscar" || urlTab === "favoritos")) {
      setTab(urlTab);
    }
  }, [onHydratedSelection, searchParams, setCodLinea, setParadaId, setTab]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (skipUrlSync.current) {
      skipUrlSync.current = false;
      return;
    }

    const params = new URLSearchParams();
    if (codLinea) params.set("linea", codLinea);
    if (paradaId) params.set("parada", paradaId);
    if (tab) params.set("tab", tab);

    const newSearch = params.toString();
    const currentSearch = searchParams.toString();

    if (newSearch !== currentSearch) {
      router.replace(pathname + (newSearch ? `?${newSearch}` : ""), {
        scroll: false,
      });
    }
  }, [codLinea, paradaId, pathname, router, searchParams, tab]);
}
