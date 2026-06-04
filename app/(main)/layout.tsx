import { Suspense } from "react";
import type { ReactNode } from "react";
import { MainLayoutClient } from "./MainLayoutClient";

/**
 * Server component layout for the (main) route group.
 *
 * Wraps the client-side MainLayoutClient in <Suspense> so that
 * useSearchParams() (used deep inside SearchFlowProvider) has a
 * proper Suspense boundary. During prerendering the fallback shell
 * is rendered; on the client the full interactive layout replaces it.
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-pwa-shell flex-col items-center justify-center gap-2 bg-background px-4 font-sans text-sm text-muted-foreground">
          <span className="spin-slow inline-block h-5 w-5 rounded-full border-2 border-white/15 border-t-accent" />
        </div>
      }
    >
      <MainLayoutClient>{children}</MainLayoutClient>
    </Suspense>
  );
}
