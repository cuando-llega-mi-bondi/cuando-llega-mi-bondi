"use client";

import { useRouter } from "next/navigation";
import { IconBus } from "./icons/IconBus";
import { cn } from "@/lib/utils";

interface HeaderProps {
    tab: "buscar" | "favoritos";
    setTab: (t: "buscar" | "favoritos") => void;
    favCount: number;
}

export function Header({ tab, setTab, favCount }: HeaderProps) {
    const router = useRouter();

    return (
        <header className="block min-h-[90px] w-full border-b border-white/10 bg-black/95 px-[calc(20px+env(safe-area-inset-left,0px))] pt-[calc(16px+env(safe-area-inset-top,0px))] pr-[calc(20px+env(safe-area-inset-right,0px))]">
            <div className="mx-auto max-w-[520px]">
                <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex items-center justify-center p-1">
                        <IconBus />
                    </div>
                    <div className="min-w-0">
                        <p className="m-0 p-0 font-display text-[24px] font-semibold leading-none tracking-[-0.05em] text-text">
                            ¿CUÁNDO LLEGA?
                        </p>
                        <div className="font-mono text-[10px] tracking-[1.4px] text-text-dim">
                            MAR DEL PLATA · TIEMPO REAL
                        </div>
                    </div>
                </div>

                <div className="flex">
                    {(["buscar", "favoritos"] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={cn(
                                "min-h-11 flex-1 border-b-2 bg-transparent py-2.5 font-sans text-[14px] font-medium tracking-[-0.01em] transition-colors",
                                tab === t
                                    ? "border-accent text-text"
                                    : "border-transparent text-text-dim hover:text-text",
                            )}
                        >
                            {t === "buscar" ? "Buscar" : `Favoritos (${favCount})`}
                        </button>
                    ))}
                    <button
                        onClick={() => router.push("/recorrido")}
                        className="min-h-11 flex-1 border-b-2 border-transparent bg-transparent py-2.5 font-sans text-[14px] font-medium tracking-[-0.01em] text-text-dim transition-colors hover:text-text"
                    >
                        Mapa
                    </button>
                </div>
            </div>
        </header>
    );
}
