import { Suspense } from "react";
import { ConsultarClient } from "./ConsultarClient";
import { HomeIntro } from "@features/landing/components/HomeIntro";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = {
  title: "Consultar",
  description: "Consultá cuándo llega tu colectivo en Mar del Plata.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-pwa-shell flex-col items-center justify-center gap-2 bg-bg px-4 font-sans text-sm text-text-dim">
          <span className="spin-slow inline-block h-5 w-5 rounded-full border-2 border-white/15 border-t-accent" />
          Cargando…
        </div>
      }
    >
      <ConsultarClient>
        <HomeIntro />
      </ConsultarClient>
    </Suspense>
  );
}
