"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@shared/layout/Header";
import { BottomNav } from "@shared/layout/BottomNav";
import { PageShell } from "@shared/layout/PageShell";
import { PageHeader } from "@shared/layout/PageHeader";

type Status = "loading" | "approved" | "pending" | "rejected" | "error";

function PaymentResult() {
  const purchaseId = useSearchParams().get("purchase");
  const [status, setStatus] = useState<Status>(purchaseId ? "loading" : "error");
  const [wentLive, setWentLive] = useState(false);
  const [rank, setRank] = useState<number | null>(null);

  const verify = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/ads/purchases/${id}`, { cache: "no-store" });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data = (await res.json()) as { status: string; wentLive?: boolean; rank?: number | null };
      setWentLive(Boolean(data.wentLive));
      setRank(typeof data.rank === "number" ? data.rank : null);
      if (data.status === "approved") setStatus("approved");
      else if (data.status === "pending") setStatus("pending");
      else setStatus("rejected");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!purchaseId) return;
    void verify(purchaseId);
    const t1 = window.setTimeout(() => void verify(purchaseId), 2000);
    const t2 = window.setTimeout(() => void verify(purchaseId), 6000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [purchaseId, verify]);

  return (
    <div className="flex min-h-pwa-shell flex-col lg:pl-60">
      <Header />
      <PageShell className="space-y-6">
        <PageHeader title="Pago" highlight="del lugar" />
        {status === "loading" ? (
          <p className="text-[15px] text-muted-foreground">Confirmando el pago…</p>
        ) : null}
        {status === "approved" && wentLive ? (
          <div className="space-y-3">
            <p className="text-[18px] font-bold">
              Ya estás en Bondi MDP{rank ? `, en el puesto ${rank}` : ""}.
            </p>
            <p className="text-[15px] text-muted-foreground">
              Tu link aparece en Consultar mientras sigas entre los dos que más
              pusieron.
            </p>
            <Link href="/consultar" className="btn-pill btn-primary inline-flex min-h-11 items-center px-5 font-bold">
              Ver el lugar
            </Link>
          </div>
        ) : null}
        {status === "approved" && !wentLive ? (
          <div className="space-y-3">
            <p className="text-[18px] font-bold">El pago salió bien, pero el lugar ya no estaba.</p>
            <p className="text-[15px] text-muted-foreground">
              Mientras estabas en MercadoPago pusieron más y quedaste fuera del
              ranking. Escribinos y vemos el reintegro.
            </p>
            <Link href="/anunciate" className="btn-pill btn-secondary inline-flex min-h-11 items-center px-5 font-bold">
              Intentar de nuevo
            </Link>
          </div>
        ) : null}
        {status === "pending" ? (
          <p className="text-[15px] text-muted-foreground">
            El pago está pendiente. Si usaste Rapipago o similar, puede tardar. Cuando acredite,
            el lugar se publica solo.
          </p>
        ) : null}
        {status === "rejected" ? (
          <div className="space-y-3">
            <p className="text-[18px] font-bold">El pago no se acreditó.</p>
            <Link href="/anunciate" className="btn-pill btn-primary inline-flex min-h-11 items-center px-5 font-bold">
              Volver a intentar
            </Link>
          </div>
        ) : null}
        {status === "error" ? (
          <p className="text-[15px] text-muted-foreground">
            No pudimos verificar el pago. Si te descontaron, esperá un minuto y recargá, o
            escribinos.
          </p>
        ) : null}
      </PageShell>
      <BottomNav />
    </div>
  );
}

export default function AnunciateExitoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-pwa-shell items-center justify-center text-sm text-muted-foreground">
          Cargando…
        </div>
      }
    >
      <PaymentResult />
    </Suspense>
  );
}
