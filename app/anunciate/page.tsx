import type { Metadata } from "next";
import { Suspense } from "react";
import { AnunciateClient } from "@features/sponsors/components/AnunciateClient";

export const metadata: Metadata = {
  title: "Anunciate",
  description:
    "Comprá un lugar publicitario en Bondi MDP. Se publican los dos que más pagaron en Consultar. No hay garantía de visitas ni ventas.",
  alternates: { canonical: "/anunciate" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://bondimdp.com.ar/anunciate",
    title: "Anunciate | Bondi MDP",
    description:
      "Comprá un lugar publicitario en Bondi MDP. Se publican los dos que más pagaron en Consultar. No hay garantía de visitas ni ventas.",
    siteName: "Bondi MDP",
    images: ["/opengraph-image"],
  },
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
