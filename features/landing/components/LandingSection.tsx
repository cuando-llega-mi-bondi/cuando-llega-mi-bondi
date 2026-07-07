"use client";

import type { ReactNode } from "react";
import { cn } from "@shared/utils";
import { BlueprintGrid, SectionEyebrow } from "./LandingDecor";

interface LandingSectionProps {
    eyebrow?: string;
    title: string;
    highlight?: string;
    description?: string;
    className?: string;
    withGrid?: boolean;
    children: ReactNode;
}

export function LandingSection({
    eyebrow,
    title,
    highlight,
    description,
    className = "",
    withGrid = false,
    children,
}: LandingSectionProps) {
    return (
        <section className={cn("relative overflow-hidden py-20", className)}>
            {withGrid ? <BlueprintGrid /> : null}
            <div className="relative z-10 mx-auto max-w-6xl px-8">
                <div className="mx-auto mb-14 max-w-2xl text-center">
                    {eyebrow ? <SectionEyebrow>{eyebrow}</SectionEyebrow> : null}
                    <h2 className="text-balance text-4xl font-black uppercase tracking-tighter lg:text-[40px]">
                        {title}
                        {highlight ? (
                            <>
                                {" "}
                                <span className="text-amarillo">{highlight}</span>
                            </>
                        ) : null}
                    </h2>
                    {description ? (
                        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                            {description}
                        </p>
                    ) : null}
                </div>

                {children}
            </div>
        </section>
    );
}
