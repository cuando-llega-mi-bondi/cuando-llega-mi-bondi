"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
    className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Icon depends on resolvedTheme; defer until mounted to avoid SSR mismatch (next-themes).
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount gate
        setMounted(true);
    }, []);

    const isDark = resolvedTheme === "dark";

    return (
        <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={
                mounted
                    ? isDark
                        ? "Activar modo claro"
                        : "Activar modo oscuro"
                    : "Cambiar tema"
            }
            disabled={!mounted}
            className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition-colors hover:border-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
                className
            )}
        >
            {!mounted ? (
                <span className="block h-[18px] w-[18px]" aria-hidden />
            ) : isDark ? (
                <Sun className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            ) : (
                <Moon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            )}
        </button>
    );
}
