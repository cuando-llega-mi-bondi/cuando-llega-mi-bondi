import Link from "next/link";
import { HomeHeader } from "./_components/Header";
import { ContextualBanner } from "./_components/ContextualBanner";
import { NearbyMap } from "./_components/NearbyMap";
import { Section } from "./_components/Section";
import { FavoriteCard } from "./_components/FavoriteCard";
import { QuickActions } from "./_components/QuickActions";
import { DEMO_FAVORITES } from "@/lib/demo/data";
import { STOPS } from "@/lib/static/stops";

export default function V2HomePage() {
  return (
    <div className="space-y-7">
      <HomeHeader />
      <ContextualBanner />
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
        <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {DEMO_FAVORITES.map((f, i) => (
            <FavoriteCard key={f.id} favorito={f} index={i} compact />
          ))}
        </div>
      </Section>

    </div>
  );
}
