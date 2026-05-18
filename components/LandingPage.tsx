import { LandingHero } from "./landing-hero";
import { LandingFeatures } from "./landing-features";
import { Footer } from "./Footer";
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
