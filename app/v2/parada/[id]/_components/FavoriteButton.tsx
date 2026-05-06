"use client";

import { useState } from "react";
import Link from "next/link";
import { useBondiAuth } from "@/lib/bondi-api/AuthContext";
import { useFavoritos } from "@/lib/bondi-api/hooks";
import { AddFavoriteSheet } from "@/app/v2/_components/AddFavoriteSheet";
import { useConfirm } from "@/app/v2/_components/ConfirmDialog";

export function FavoriteButton({
    stopId,
    stopName,
}: {
    stopId: string;
    stopName: string;
}) {
    const { state } = useBondiAuth();
    const { favoritos, remove, ready } = useFavoritos();
    const confirm = useConfirm();
    const [openSheet, setOpenSheet] = useState(false);

    if (state.status === "loading") {
        return <div className="h-10 w-28 animate-pulse rounded-full bg-[#E8E2D2]" />;
    }

    if (state.status !== "authenticated") {
        return (
            <Link
                href={`/v2/login?next=/v2/parada/${encodeURIComponent(stopId)}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E2D2] bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[#6B7080]"
            >
                <Star filled={false} />
                Ingresá para guardar
            </Link>
        );
    }

    const fav = ready ? favoritos.find((f) => f.parada_id === stopId) : null;

    if (fav) {
        return (
            <button
                type="button"
                onClick={async () => {
                    const ok = await confirm({
                        title: `Quitar "${fav.apodo}" de favoritos`,
                        body: "Lo podés volver a agregar cuando quieras.",
                        confirmLabel: "Quitar",
                        tone: "danger",
                    });
                    if (ok) void remove(fav.id);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#FFD60A] px-3 py-1.5 font-display text-[12px] font-semibold text-[#0F1115]"
            >
                <Star filled />
                {fav.emoji ?? ""} {fav.apodo}
            </button>
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpenSheet(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#0099FF] bg-white px-3 py-1.5 font-display text-[12px] font-semibold text-[#0099FF] hover:bg-[#0099FF] hover:text-white"
            >
                <Star filled={false} />
                Guardar
            </button>
            {openSheet ? (
                <AddFavoriteSheet
                    initialStopId={stopId}
                    initialApodo={stopName}
                    onClose={() => setOpenSheet(false)}
                />
            ) : null}
        </>
    );
}

function Star({ filled }: { filled: boolean }) {
    return (
        <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} className="h-3.5 w-3.5">
            <path
                d="m12 3 2.83 5.74 6.34.92-4.59 4.47 1.08 6.31L12 17.77l-5.66 2.97 1.08-6.31L2.83 9.66l6.34-.92L12 3Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
        </svg>
    );
}
