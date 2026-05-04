import { LandingHero } from "./landing-hero";
import { LandingFeatures } from "./landing-features";
import { Footer } from "./Footer";
import { LandingTestimonials } from "./LandingTestimonials";
import { SocialTestimonials } from "./SocialTestimonials";

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <LandingHero />
      <LandingTestimonials />
      <LandingFeatures />
      <SocialTestimonials />
      <Footer />
    </main>
  );
}
