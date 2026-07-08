"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconSearch } from "@shared/icons/IconSearch";
import { IconStar } from "@shared/icons/IconStar";
import { IconMap } from "@shared/icons/IconMap";
import { IconInfo } from "@shared/icons/IconInfo";
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

export function BottomNav() {
    const pathname = usePathname();

    const activeTab = useMemo((): NavTab => {
        if (pathname.startsWith("/favoritos")) return "favoritos";
        if (pathname.startsWith("/recorrido")) return "recorrido";
        if (pathname.startsWith("/acerca")) return "acerca";
        return "consultar";
    }, [pathname]);

    return (
        <nav
            className="fixed bottom-0 left-0 z-[100] w-full border-t border-border bg-background/90 backdrop-blur-xl pb-safe-area-bottom"
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