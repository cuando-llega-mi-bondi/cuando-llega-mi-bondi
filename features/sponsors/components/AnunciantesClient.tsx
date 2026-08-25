"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import type { AdBoardView } from "@features/sponsors/lib/purchases";
import { getRememberedAdPurchaseIds } from "@features/sponsors/lib/myAds";
import { AdHistory } from "./AdHistory";
import { Footer } from "@shared/layout/Footer";
import { Header } from "@shared/layout/Header";
import { BottomNav } from "@shared/layout/BottomNav";
import { PageShell } from "@shared/layout/PageShell";
import { PageHeader } from "@shared/layout/PageHeader";

async function fetchBoard(url: string): Promise<AdBoardView> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar el ranking");
  return res.json() as Promise<AdBoardView>;
}

export function AnunciantesClient() {
  const { data: board } = useSWR("/api/ads/board", fetchBoard, { revalidateOnFocus: true });
  const [rememberedIds] = useState(() => getRememberedAdPurchaseIds());
  const liveIds = (board?.podium ?? []).map((entry) => entry.id);

  return (
    <div className="flex min-h-pwa-shell flex-col lg:pl-60">
      <Header />
      <PageShell className="space-y-6">
        <PageHeader
          title="Todos los"
          highlight="anunciantes"
          subtitle="Los dos primeros están al aire en Consultar ahora mismo. El resto es historial."
        />

        <AdHistory liveIds={liveIds} mineIds={rememberedIds} />

        <p className="text-[13px] leading-relaxed text-muted-foreground">
          ¿Querés aparecer acá?{" "}
          <Link href="/anunciate" className="font-semibold text-secondary underline underline-offset-2">
            Anunciate
          </Link>
          .
        </p>

        <Footer />
      </PageShell>
      <BottomNav />
    </div>
  );
}
