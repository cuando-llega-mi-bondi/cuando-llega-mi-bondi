"use client";

import { IconBus } from "@shared/icons/IconBus";
import { ThemeToggle } from "./ThemeToggle";
import { BrandLogo } from "@shared/ui/BrandLogo";

export function Header() {
    return (
        <header className="block w-full border-b border-border bg-background/90 backdrop-blur-md px-[calc(20px+var(--safe-left))] pt-[calc(16px+var(--safe-top))] pr-[calc(20px+var(--safe-right))] pb-4 sticky top-0 z-50">
            <div className="mx-auto max-w-[520px] lg:max-w-3xl">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex items-center justify-center p-1 lg:hidden">
                            <IconBus />
                        </div>
                        <div className="min-w-0">
                            <BrandLogo className="text-2xl lg:text-4xl" />
                        </div>
                    </div>
                    {/* En lg el toggle vive en la sidebar */}
                    <div className="lg:hidden">
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </header>
    );
}
