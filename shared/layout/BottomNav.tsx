"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconSearch } from "@shared/icons/IconSearch";
import { IconStar } from "@shared/icons/IconStar";
import { IconMap } from "@shared/icons/IconMap";
import { IconInfo } from "@shared/icons/IconInfo";
import { IconBus } from "@shared/icons/IconBus";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@shared/utils";

type NavTab = "consultar" | "recorrido" | "favoritos" | "acerca";

const NAV_ITEMS: { id: NavTab; label: string; href: string; icon: (active: boolean) => React.ReactNode }[] = [
    {
        id: "consultar",
        label: "Consultar",
        href: "/consultar",
        icon: () => <IconSearch className="h-[22px] w-[22px]" />,
    },
    {
        id: "recorrido",
        label: "Recorridos",
        href: "/recorrido",
        icon: () => <IconMap className="h-[22px] w-[22px]" />,
    },
    {
        id: "favoritos",
        label: "Favoritos",
        href: "/favoritos",
        icon: (active) => <IconStar filled={active} className="h-[22px] w-[22px]" />,
    },
    {
        id: "acerca",
        label: "Acerca de",
        href: "/acerca",
        icon: () => <IconInfo className="h-[22px] w-[22px]" />,
    },
];

function useActiveTab(): NavTab {
    const pathname = usePathname();

    return useMemo((): NavTab => {
        if (pathname.startsWith("/favoritos")) return "favoritos";
        if (pathname.startsWith("/recorrido")) return "recorrido";
        if (pathname.startsWith("/acerca")) return "acerca";
        return "consultar";
    }, [pathname]);
}

/** Barra inferior — solo mobile (<lg). */
function MobileBar() {
    const activeTab = useActiveTab();

    return (
        <nav
            className="fixed bottom-0 left-0 z-[100] w-full border-t border-border bg-background/90 backdrop-blur-xl pb-safe-area-bottom lg:hidden"
        >
            <div className="mx-auto flex max-w-[520px] items-stretch justify-around">
                {NAV_ITEMS.map(({ id, label, href, icon }) => {
                    const isActive = activeTab === id;
                    return (
                        <Link
                            key={id}
                            href={href}
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
                            {icon(isActive)}
                            <span className="font-sans text-[11px] font-medium tracking-tight">
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

/** Rail lateral — solo desktop (≥lg). Ancho w-19 (76px), compensar con lg:pl-19. */
function SideNav() {
    const activeTab = useActiveTab();

    return (
        <nav
            className="fixed left-0 top-0 z-[100] hidden h-dvh w-19 flex-col items-center border-r border-border bg-background/90 backdrop-blur-xl lg:flex"
            aria-label="Navegación principal"
        >
            <Link
                href="/consultar"
                aria-label="Bondi MDP — Inicio"
                className="flex h-16 w-full items-center justify-center text-secondary transition-colors hover:text-foreground"
            >
                <IconBus />
            </Link>

            <div className="flex flex-1 flex-col items-stretch gap-1 pt-2">
                {NAV_ITEMS.map(({ id, label, href, icon }) => {
                    const isActive = activeTab === id;
                    return (
                        <Link
                            key={id}
                            href={href}
                            aria-label={label}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                                "relative flex w-full flex-col items-center gap-1 rounded-lg px-1 py-3 transition-colors",
                                isActive
                                    ? "text-secondary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {/* Active bar at left */}
                            <span
                                className={cn(
                                    "absolute left-0 top-2 bottom-2 w-[2px] rounded-r-full bg-secondary transition-opacity duration-200",
                                    isActive ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {icon(isActive)}
                            <span className="font-sans text-[10px] font-medium tracking-tight">
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>

            <div className="flex w-full items-center justify-center pb-4">
                <ThemeToggle />
            </div>
        </nav>
    );
}

export function BottomNav() {
    return (
        <>
            <MobileBar />
            <SideNav />
        </>
    );
}
