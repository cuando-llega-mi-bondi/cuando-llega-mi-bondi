"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { IconSearch } from "./icons/IconSearch";
import { IconStar } from "./icons/IconStar";
import { IconMap } from "./icons/IconMap";
import { IconInfo } from "./icons/IconInfo";
import { cn } from "@/lib/utils";

interface BottomNavProps {
    tab: "buscar" | "favoritos";
    setTab: (t: "buscar" | "favoritos") => void;
    favCount: number;
}

export function BottomNav({ tab, setTab, favCount }: BottomNavProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isRecorrido = pathname === "/recorrido";
    const isAcerca = pathname === "/acerca";

    const handleTabClick = (t: "buscar" | "favoritos") => {
        if (isRecorrido || isAcerca) {
            router.push(`/?tab=${t}`);
            return;
        }
        setTab(t);
    };

    return (
        <nav className="fixed bottom-0 left-0 z-[100] w-full border-t border-border bg-background/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom,0px)]">
            <div className="mx-auto flex max-w-[520px] items-stretch justify-around px-2">
                <button
                    onClick={() => handleTabClick("buscar")}
                    className={cn(
                        "flex flex-1 flex-col items-center justify-center gap-1.5 py-3 transition-colors",
                        !isRecorrido && !isAcerca && tab === "buscar" ? "text-secondary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <IconSearch className="h-[22px] w-[22px]" />
                    <span className="font-sans text-[11px] font-medium tracking-tight">Consultar</span>
                    {!isRecorrido && !isAcerca && tab === "buscar" && (
                        <div className="absolute bottom-1 h-1 w-1 rounded-full bg-secondary" />
                    )}
                </button>

                <button
                    onClick={() => router.push("/recorrido")}
                    className={cn(
                        "flex flex-1 flex-col items-center justify-center gap-1.5 py-3 transition-colors",
                        isRecorrido ? "text-secondary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <IconMap className="h-[22px] w-[22px]" />
                    <span className="font-sans text-[11px] font-medium tracking-tight">Recorridos</span>
                    {isRecorrido && (
                        <div className="absolute bottom-1 h-1 w-1 rounded-full bg-secondary" />
                    )}
                </button>

                <button
                    onClick={() => handleTabClick("favoritos")}
                    className={cn(
                        "flex flex-1 flex-col items-center justify-center gap-1.5 py-3 transition-colors",
                        !isRecorrido && !isAcerca && tab === "favoritos" ? "text-secondary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <div className="relative">
                        <IconStar filled={!isRecorrido && !isAcerca && tab === "favoritos"} className="h-[22px] w-[22px]" />
                        {mounted && favCount > 0 && (
                            <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 font-mono text-[9px] font-bold text-primary-foreground">
                                {favCount}
                            </span>
                        )}
                    </div>
                    <span className="font-sans text-[11px] font-medium tracking-tight">Favoritos</span>
                    {!isRecorrido && !isAcerca && tab === "favoritos" && (
                        <div className="absolute bottom-1 h-1 w-1 rounded-full bg-secondary" />
                    )}
                </button>

                <button
                    onClick={() => router.push("/acerca")}
                    className={cn(
                        "flex flex-1 flex-col items-center justify-center gap-1.5 py-3 transition-colors",
                        isAcerca ? "text-secondary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <IconInfo className="h-[22px] w-[22px]" />
                    <span className="font-sans text-[11px] font-medium tracking-tight">Acerca de</span>
                    {isAcerca && (
                        <div className="absolute bottom-1 h-1 w-1 rounded-full bg-secondary" />
                    )}
                </button>
            </div>
        </nav>
    );
}
