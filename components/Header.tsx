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
        <header className="block min-h-[90px] w-full border-b border-border bg-surface px-[calc(20px+env(safe-area-inset-left,0px))] pt-[calc(16px+env(safe-area-inset-top,0px))] pr-[calc(20px+env(safe-area-inset-right,0px))]">
            <div className="mx-auto max-w-[520px]">
                <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex rounded-lg bg-accent px-2 py-1.5 text-black">
                        <IconBus />
                    </div>
                    <div className="min-w-0">
                        <p className="m-0 p-0 font-display text-[22px] font-black uppercase leading-none tracking-[1px]">
                            ¿CUÁNDO LLEGA?
                        </p>
                        <div className="font-mono text-[11px] tracking-[2px] text-text-dim">
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
                                "min-h-11 flex-1 border-b-2 bg-transparent py-2.5 font-display text-[15px] font-bold uppercase tracking-[1px] transition-colors",
                                tab === t
                                    ? "border-accent text-accent"
                                    : "border-transparent text-text-dim hover:text-text",
                            )}
                        >
                            {t === "buscar" ? "Buscar" : `Favoritos (${favCount})`}
                        </button>
                    ))}
                    <button
                        onClick={() => router.push("/recorrido")}
                        className="min-h-11 flex-1 border-b-2 border-transparent bg-transparent py-2.5 font-display text-[15px] font-bold uppercase tracking-[1px] text-text-dim transition-colors hover:text-text"
                    >
                        Mapa
                    </button>
                </div>
            </div>
        </header>
    );
}
