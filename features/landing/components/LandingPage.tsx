import { LandingHero } from "./LandingHero";
import { LandingFeatures } from "./LandingFeatures";
import { Footer } from "@shared/layout/Footer";
import { LandingTestimonials } from "./LandingTestimonials";
import { SocialTestimonials } from "./SocialTestimonials";
import { HomeIntro } from "./HomeIntro";

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <HomeIntro />
      <LandingHero />
      <LandingTestimonials />
      <LandingFeatures />
      <SocialTestimonials />
      <Footer />
    </main>
  );
}
