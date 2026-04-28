"use client";

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

    const isRecorrido = pathname === "/recorrido";

    const handleTabClick = (t: "buscar" | "favoritos") => {
        if (isRecorrido) {
            router.push(`/?tab=${t}`);
            return;
        }
        setTab(t);
    };

    return (
        <nav className="fixed bottom-0 left-0 z-[100] w-full border-t border-white/10 bg-black/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom,0px)]">
            <div className="mx-auto flex max-w-[520px] items-stretch justify-around px-2">
                <button
                    onClick={() => handleTabClick("buscar")}
                    className={cn(
                        "flex flex-1 flex-col items-center justify-center gap-1.5 py-3 transition-colors",
                        !isRecorrido && tab === "buscar" ? "text-accent" : "text-text-dim hover:text-text"
                    )}
                >
                    <IconSearch className="h-[22px] w-[22px]" />
                    <span className="font-sans text-[11px] font-medium tracking-tight">Consultar</span>
                    {!isRecorrido && tab === "buscar" && (
                        <div className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />
                    )}
                </button>

                <button
                    onClick={() => router.push("/recorrido")}
                    className={cn(
                        "flex flex-1 flex-col items-center justify-center gap-1.5 py-3 transition-colors",
                        isRecorrido ? "text-accent" : "text-text-dim hover:text-text"
                    )}
                >
                    <IconMap className="h-[22px] w-[22px]" />
                    <span className="font-sans text-[11px] font-medium tracking-tight">Recorridos</span>
                    {isRecorrido && (
                        <div className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />
                    )}
                </button>

                <button
                    onClick={() => handleTabClick("favoritos")}
                    className={cn(
                        "flex flex-1 flex-col items-center justify-center gap-1.5 py-3 transition-colors",
                        !isRecorrido && tab === "favoritos" ? "text-accent" : "text-text-dim hover:text-text"
                    )}
                >
                    <div className="relative">
                        <IconStar filled={!isRecorrido && tab === "favoritos"} className="h-[22px] w-[22px]" />
                        {favCount > 0 && (
                            <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 font-mono text-[9px] font-bold text-black">
                                {favCount}
                            </span>
                        )}
                    </div>
                    <span className="font-sans text-[11px] font-medium tracking-tight">Favoritos</span>
                    {!isRecorrido && tab === "favoritos" && (
                        <div className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />
                    )}
                </button>

                <button
                    className="flex flex-1 flex-col items-center justify-center gap-1.5 py-3 text-text-dim transition-colors hover:text-text"
                    onClick={() => {
                        // Maybe show a simple alert or modal later
                        alert("¿Cuándo Llega? MDP - Desarrollado con ❤️ para Mar del Plata.");
                    }}
                >
                    <IconInfo className="h-[22px] w-[22px]" />
                    <span className="font-sans text-[11px] font-medium tracking-tight">Acerca de</span>
                </button>
            </div>
        </nav>
    );
}
