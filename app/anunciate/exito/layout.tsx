import type { Metadata } from "next";
import type { ReactNode } from "react";

// page.tsx es "use client" y no puede exportar metadata: el noindex vive acá.
export const metadata: Metadata = {
  title: "Resultado del pago",
  robots: { index: false, follow: false },
};

export default function AnunciateExitoLayout({ children }: { children: ReactNode }) {
  return children;
}
