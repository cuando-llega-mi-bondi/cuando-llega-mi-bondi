import Link from "next/link";
import { Header } from "@shared/layout/Header";
import { BottomNav } from "@shared/layout/BottomNav";
import { PageShell } from "@shared/layout/PageShell";
import { PageHeader } from "@shared/layout/PageHeader";

export default function AnunciateErrorPage() {
  return (
    <div className="flex min-h-pwa-shell flex-col lg:pl-60">
      <Header />
      <PageShell className="space-y-6">
        <PageHeader title="Pago" highlight="cancelado" />
        <p className="text-[15px] text-muted-foreground">
          No se acreditó el pago. El lugar sigue como estaba.
        </p>
        <Link href="/anunciate" className="btn-pill btn-primary inline-flex min-h-11 items-center px-5 font-bold">
          Volver a intentar
        </Link>
      </PageShell>
      <BottomNav />
    </div>
  );
}
