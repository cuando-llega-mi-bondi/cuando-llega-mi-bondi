"use client";

import { LandingSection } from "./LandingSection";
import { PressMentions } from "./PressMentions";

export function LandingTestimonials() {
  return (
    <LandingSection
      title="Repercusión en"
      highlight="los medios."
    >
      <PressMentions />
    </LandingSection>
  );
}
