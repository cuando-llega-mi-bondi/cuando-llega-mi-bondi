// components/LandingTestimonials.tsx
"use client";
import { LandingSection } from "./LandingSection";
import { PressMentions } from "./PressMentions";

export function LandingTestimonials() {
  return (
    <LandingSection
      title="Hablan de"
      highlight="nosotros"
      description="El impacto de bondiMDP en los medios locales."
    >
      <PressMentions />
    </LandingSection>
  );
}
