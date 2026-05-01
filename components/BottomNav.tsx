"use client";

import { useCallback, useMemo } from "react";
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

type NavTab = "buscar" | "favoritos" | "recorrido" | "acerca";

export function BottomNav({ tab, setTab, favCount }: BottomNavProps) {
    const router = useRouter();
    const pathname = usePathname();

    const activeTab = useMemo((): NavTab => {
        if (pathname === "/recorrido") return "recorrido";
        if (pathname === "/acerca") return "acerca";
        return tab;
    }, [pathname, tab]);

    const handleConsultarTab = useCallback(
        (t: "buscar" | "favoritos") => {
            if (activeTab === "recorrido" || activeTab === "acerca") {
                router.push(`/consultar/?tab=${t}`);
            } else {
                setTab(t);
            }
        },
        [activeTab, router, setTab]
    );

    const goToRecorrido = useCallback(() => router.push("/recorrido"), [router]);
    const goToAcerca = useCallback(() => router.push("/acerca"), [router]);

    const items = useMemo(
        () => [
            {
                id: "buscar" as NavTab,
                label: "Consultar",
                icon: <IconSearch className="h-[22px] w-[22px]" />,
                onClick: () => handleConsultarTab("buscar"),
            },
            {
                id: "recorrido" as NavTab,
                label: "Recorridos",
                icon: <IconMap className="h-[22px] w-[22px]" />,
                onClick: goToRecorrido,
            },
            {
                id: "favoritos" as NavTab,
                label: "Favoritos",
                icon: (
                    <div className="relative">
                        <IconStar
                            filled={activeTab === "favoritos"}
                            className="h-[22px] w-[22px]"
                        />
                        {favCount > 0 && (
                            <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 font-mono text-[9px] font-bold text-primary-foreground">
                                {favCount > 99 ? "99+" : favCount}
                            </span>
                        )}
                    </div>
                ),
                onClick: () => handleConsultarTab("favoritos"),
            },
            {
                id: "acerca" as NavTab,
                label: "Acerca de",
                icon: <IconInfo className="h-[22px] w-[22px]" />,
                onClick: goToAcerca,
            },
        ],
        [activeTab, favCount, handleConsultarTab, goToRecorrido, goToAcerca]
    );

    return (
        <nav
            className="fixed bottom-0 left-0 z-[100] w-full border-t border-border bg-background/90 backdrop-blur-xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
            <div className="mx-auto flex max-w-[520px] items-stretch justify-around">
                {items.map(({ id, label, icon, onClick }) => {
                    const isActive = activeTab === id;
                    return (
                        <button
                            key={id}
                            onClick={onClick}
                            aria-label={label}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                                "relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
                                isActive
                                    ? "text-secondary"
                                    : "text-muted-foreground hover:text-foreground active:text-foreground"
                            )}
                        >
                            {/* Active bar at top */}
                            <span
                                className={cn(
                                    "absolute inset-x-3 top-0 h-[2px] rounded-b-full bg-secondary transition-opacity duration-200",
                                    isActive ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {icon}
                            <span className="font-sans text-[11px] font-medium tracking-tight">
                                {label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}