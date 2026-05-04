"use client";

import type { ReactNode } from "react";

interface LandingSectionProps {
  title: string;
  highlight?: string;
  description?: string;
  className?: string;
  children: ReactNode;
}

export function LandingSection({
  title,
  highlight,
  description,
  className = "",
  children,
}: LandingSectionProps) {
  return (
    <section className={`py-24 relative overflow-hidden ${className}`}>
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-[40px] flex-wrap text-balance font-black uppercase tracking-tighter mb-4 flex items-center justify-center gap-3">
            {title}
            {highlight ? (
              <span className="text-amarillo">{highlight}</span>
            ) : null}
          </h2>
          {description ? (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {description}
            </p>
          ) : null}
        </div>

        {children}
      </div>
    </section>
  );
}
