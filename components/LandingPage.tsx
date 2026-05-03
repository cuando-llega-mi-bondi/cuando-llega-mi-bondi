import { LandingHero } from "./landing-hero";
import { LandingFeatures } from "./landing-features";
import { Footer } from "./Footer";
import { LandingTestimonials } from "./LandingTestimonials";

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <LandingHero />
      <LandingFeatures />
      <LandingTestimonials />
      <Footer />
    </main>
  );
}
