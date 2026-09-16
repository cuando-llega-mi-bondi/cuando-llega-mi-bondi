import { LandingHero } from "./LandingHero";
import { LandingFeatures } from "./LandingFeatures";
import { Footer } from "@shared/layout/Footer";
import { LandingTestimonials } from "./LandingTestimonials";
import { LandingStats } from "./LandingStats";
import { SocialTestimonials } from "./SocialTestimonials";
import { LandingAuthors } from "./LandingAuthors";
import { LandingSponsors } from "./LandingSponsors";
import { LandingFaq } from "./LandingFaq";
import { LandingCta } from "./LandingCta";
import { ParallaxDecor } from "./ParallaxDecor";
import { Reveal } from "./Reveal";
import { HomeIntro } from "./HomeIntro";
import { LandingMotionConfig } from "./LandingMotionConfig";

export function LandingPage() {
  return (
    // One continuous "blueprint" background across the whole landing so section
    // transitions blend instead of hard-cutting. `.dark` forces the dark palette
    // regardless of the user's global theme.
    <main
      className="dark relative min-h-screen overflow-hidden text-foreground"
      style={{
        background:
          "linear-gradient(180deg, #143a5e 0%, #0f2d4a 22%, #0c2540 68%, #0f2d4a 100%)",
      }}
    >
      <LandingMotionConfig>
        {/* Parallax backdrop: Mar del Plata map + ambient glows */}
        <ParallaxDecor />

        <div className="relative z-10">
          <HomeIntro />
          <LandingHero />
          <Reveal>
            <LandingFeatures />
          </Reveal>
          <Reveal>
            <LandingTestimonials />
          </Reveal>
          <Reveal>
            <LandingStats />
          </Reveal>
          <Reveal>
            <SocialTestimonials />
          </Reveal>
          <Reveal>
            <LandingAuthors />
          </Reveal>
          <Reveal>
            <LandingSponsors />
          </Reveal>
          <LandingFaq />
          <Reveal>
            <LandingCta />
          </Reveal>
          <p className="px-8 pb-2 text-center text-[11px] text-muted-foreground/70">
            Mapa © OpenStreetMap contributors
          </p>
          <Footer />
        </div>
      </LandingMotionConfig>
    </main>
  );
}
