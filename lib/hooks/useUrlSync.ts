"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface UseUrlSyncParams {
    codLinea: string;
    paradaId: string;
    setCodLinea: (value: string) => void;
    setParadaId: (value: string) => void;
    onHydratedSelection?: () => void;
}

export function useUrlSync({
    codLinea,
    paradaId,
    setCodLinea,
    setParadaId,
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

        if (urlLinea && urlParada) {
            skipUrlSync.current = true;
            setCodLinea(urlLinea);
            setParadaId(urlParada);
            onHydratedSelection?.();
        }
    }, [onHydratedSelection, searchParams, setCodLinea, setParadaId]);

    useEffect(() => {
        if (!hydrated.current) return;
        if (skipUrlSync.current) {
            skipUrlSync.current = false;
            return;
        }

        const params = new URLSearchParams();
        if (codLinea) params.set("linea", codLinea);
        if (paradaId) params.set("parada", paradaId);

        const newSearch = params.toString();
        const currentSearch = searchParams.toString();

        if (newSearch !== currentSearch) {
            router.replace(pathname + (newSearch ? `?${newSearch}` : ""), {
                scroll: false,
            });
        }
    }, [codLinea, paradaId, pathname, router, searchParams]);
}
