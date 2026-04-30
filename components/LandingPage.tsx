import { LandingHero } from "./landing-hero";
import { LandingFeatures } from "./landing-features";

export function LandingPage() {
    return (
        <main className="min-h-screen bg-background">
            <LandingHero />
            <LandingFeatures />
        </main>
    );
}
