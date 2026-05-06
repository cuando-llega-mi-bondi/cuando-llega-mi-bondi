"use client";

import { useEffect, useState } from "react";
import {
    checkSupport,
    getSubscriptionStatus,
    subscribe,
    unsubscribe,
} from "@/lib/bondi-api/push";

type State =
    | { kind: "loading" }
    | { kind: "unsupported"; reason: string }
    | { kind: "ready"; subscribed: boolean; permission: NotificationPermission };

export function PushToggle() {
    const [state, setState] = useState<State>({ kind: "loading" });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const support = checkSupport();
        if (!support.ok) {
            setState({ kind: "unsupported", reason: support.reason });
            return;
        }
        getSubscriptionStatus()
            .then((s) => setState({ kind: "ready", ...s }))
            .catch(() => setState({ kind: "unsupported", reason: "init_failed" }));
    }, []);

    if (state.kind === "loading") {
        return (
            <div className="rounded-2xl border border-[#E8E2D2] bg-white/70 p-4">
                <div className="h-4 w-32 animate-pulse rounded bg-[#E8E2D2]" />
            </div>
        );
    }

    if (state.kind === "unsupported") {
        return (
            <div className="rounded-2xl border border-dashed border-[#E8E2D2] bg-white/50 p-4">
                <p className="font-display text-[13px] font-semibold text-[#0F1115]">
                    Tu navegador no soporta notificaciones push.
                </p>
                <p className="mt-0.5 font-mono text-[10.5px] text-[#6B7080]">
                    Probá desde Chrome/Edge/Firefox o instalá la PWA en tu celu.
                </p>
            </div>
        );
    }

    const subscribed = state.subscribed;

    async function toggle() {
        setBusy(true);
        setError(null);
        try {
            if (subscribed) {
                await unsubscribe();
            } else {
                await subscribe();
            }
            const next = await getSubscriptionStatus();
            setState({ kind: "ready", ...next });
        } catch (e) {
            const msg = (e as Error).message;
            if (msg === "permission_denied") {
                setError("Permitiste el bloqueo de notificaciones. Habilitalo en el browser para activar.");
            } else {
                setError("No se pudo cambiar el estado. Probá de nuevo.");
            }
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="rounded-2xl border border-[#E8E2D2] bg-white p-4 v2-card-shadow">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-display text-[14px] font-semibold text-[#0F1115]">
                        Notificaciones push
                    </p>
                    <p className="font-mono text-[10.5px] text-[#6B7080]">
                        {subscribed
                            ? "Activadas en este dispositivo"
                            : "Activá para recibir avisos de bondi y recordatorios"}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={toggle}
                    disabled={busy}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
                        subscribed ? "bg-[#0099FF]" : "bg-[#E8E2D2]"
                    }`}
                    aria-pressed={subscribed}
                >
                    <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                            subscribed ? "translate-x-[22px]" : "translate-x-0.5"
                        }`}
                    />
                </button>
            </div>
            {error ? (
                <p className="mt-2 rounded-lg border border-[#F5C2C7] bg-[#FFF5F5] px-2.5 py-1.5 font-mono text-[10.5px] text-[#A02525]">
                    {error}
                </p>
            ) : null}
        </div>
    );
}
