"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@shared/ui/Spinner";

/**
 * Pasados estos ms de carga, avisamos que puede tardar (peor caso documentado
 * del proxy: renovación de sesión con Cloudflare, hasta ~25s). Un solo aviso
 * — encadenar dos mensajes distintos en pocos segundos suma ruido, no claridad.
 */
const SLOW_NOTICE_MS = 4_000;

export function ArrivalsLoading() {
    const [isSlow, setIsSlow] = useState(false);

    useEffect(() => {
        const id = setTimeout(() => setIsSlow(true), SLOW_NOTICE_MS);
        return () => clearTimeout(id);
    }, []);

    return (
        <div className="arrivals-loading-panel">
            <div className="mb-[18px] flex items-center justify-center gap-3 font-sans text-sm tracking-tight text-muted-foreground">
                <Spinner className="h-[22px] w-[22px]" />
                <span role="status">Consultando horarios…</span>
            </div>
            <div className="flex flex-col gap-2" aria-hidden>
                <div className="arrivals-skeleton-row" />
                <div className="arrivals-skeleton-row" />
                <div className="arrivals-skeleton-row opacity-70" />
            </div>
            {isSlow ? (
                <p
                    className="mt-3 animate-slide-up text-center font-sans text-xs leading-relaxed text-muted-foreground"
                    role="status"
                >
                    Puede tardar hasta ~25s la primera vez — seguimos
                    intentando.
                </p>
            ) : null}
        </div>
    );
}
