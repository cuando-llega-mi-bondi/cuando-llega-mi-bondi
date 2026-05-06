import Link from "next/link";
import { HomeHeader } from "./_components/Header";
import { NearbyMap } from "./_components/NearbyMap";
import { Section } from "./_components/Section";
import { QuickActions } from "./_components/QuickActions";
import { HomeFavorites } from "./_components/HomeFavorites";
import { STOPS } from "@/lib/static/stops";

export default function V2HomePage() {
  return (
    <div className="space-y-7">
      <HomeHeader />
      <QuickActions />

      <Section
        eyebrow="Cerca tuyo"
        title="Paradas a la vuelta"
        action={
          <Link
            href="/v2/buscar"
            className="font-mono text-[10.5px] uppercase tracking-wider text-[#0099FF] hover:text-[#0F1115]"
          >
            Ver todas →
          </Link>
        }
      >
        <NearbyMap stops={STOPS} />
      </Section>

      <Section
        eyebrow="Tus lugares"
        title="Favoritos"
        action={
          <Link
            href="/v2/favoritos"
            className="font-mono text-[10.5px] uppercase tracking-wider text-[#0099FF] hover:text-[#0F1115]"
          >
            Ver todos →
          </Link>
        }
      >
        <HomeFavorites />
      </Section>
    </div>
  );
}
