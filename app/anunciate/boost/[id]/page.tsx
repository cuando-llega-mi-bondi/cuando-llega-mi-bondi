import type { Metadata } from "next";
import { BoostClient } from "@features/sponsors/components/BoostClient";

export const metadata: Metadata = {
  title: "Potenciar aviso",
  description: "Sumale plata a un aviso que ya está aprobado y empujalo en el ranking.",
};

export default async function BoostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BoostClient purchaseId={id} />;
}
