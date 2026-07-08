"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@shared/ui/Spinner";

/** Pasados estos ms de carga, avisamos que la fuente está tardando. */
const SLOW_NOTICE_MS = 6_000;

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
                <span>Consultando horarios…</span>
            </div>
            <div className="flex flex-col gap-2">
                <div className="arrivals-skeleton-row" />
                <div className="arrivals-skeleton-row" />
                <div className="arrivals-skeleton-row opacity-70" />
            </div>
            {isSlow ? (
                <p className="mt-3 animate-slide-up text-center font-sans text-xs leading-relaxed text-muted-foreground">
                    La Municipalidad está tardando en responder… seguimos
                    intentando.
                </p>
            ) : null}
        </div>
    );
}
