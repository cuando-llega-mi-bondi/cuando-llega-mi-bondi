import type { Metadata } from "next";
import { Suspense } from "react";
import { AnunciateClient } from "@features/sponsors/components/AnunciateClient";

export const metadata: Metadata = {
  title: "Anunciate",
  description:
    "Comprá un lugar publicitario en Bondi MDP. Hay dos recuadros en Consultar; cada uno se subasta aparte. No hay garantía de visitas ni ventas.",
  alternates: { canonical: "/anunciate" },
};

export default function AnunciatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-pwa-shell items-center justify-center text-sm text-muted-foreground">
          Cargando…
        </div>
      }
    >
      <AnunciateClient />
    </Suspense>
  );
}
