// components/LandingTestimonials.tsx
"use client";
import { LandingSection } from "./LandingSection";
import { PressMentions } from "./PressMentions";

export function LandingTestimonials() {
  return (
    <LandingSection
      eyebrow="En los medios"
      title="Hablan de"
      highlight="nosotros"
      description="El impacto de Bondi MDP en los medios locales."
    >
      <PressMentions />
    </LandingSection>
  );
}
