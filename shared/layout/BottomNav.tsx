"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bus } from "lucide-react";
import { IconSearch } from "@shared/icons/IconSearch";
import { IconStar } from "@shared/icons/IconStar";
import { IconInfo } from "@shared/icons/IconInfo";
import { IconBus } from "@shared/icons/IconBus";
import { BrandLogo } from "@shared/ui/BrandLogo";
import { ThemeToggle } from "./ThemeToggle";
import { PlayStoreNavLink } from "./PlayStoreNavLink";
import { cn } from "@shared/utils";

type NavTab = "consultar" | "recorrido" | "favoritos" | "acerca";

const NAV_ITEMS: { id: NavTab; label: string; href: string; icon: (active: boolean) => React.ReactNode }[] = [
    {
        id: "consultar",
        label: "Consultar",
        href: "/",
        icon: () => <IconSearch className="h-[20px] w-[20px]" />,
    },
    {
        id: "recorrido",
        label: "Reseñas",
        href: "/recorrido",
        icon: () => <Bus className="h-[20px] w-[20px]" />,
    },
    {
        id: "favoritos",
        label: "Favoritos",
        href: "/favoritos",
        icon: (active) => <IconStar filled={active} className="h-[20px] w-[20px]" />,
    },
    {
        id: "acerca",
        label: "Acerca de",
        href: "/acerca",
        icon: () => <IconInfo className="h-[20px] w-[20px]" />,
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

function NavTabRow() {
    const activeTab = useActiveTab();

    return (
        <div className="mx-auto flex w-full max-w-[520px] items-stretch justify-around">
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
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground active:text-foreground"
                        )}
                    >
                        <span
                            className={cn(
                                "absolute inset-x-3 top-0 h-[2px] rounded-b-full bg-foreground transition-opacity duration-200",
                                isActive ? "opacity-100" : "opacity-0"
                            )}
                        />
                        {icon(isActive)}
                        <span className="font-sans text-xs font-medium tracking-tight">
                            {label}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}

/** Barra inferior — solo mobile (<lg). */
function MobileBar() {
    return (
        <nav
            aria-label="Navegación principal"
            className="fixed bottom-0 left-0 z-[100] w-full border-t border-border bg-background/90 backdrop-blur-xl pb-safe-area-bottom lg:hidden"
        >
            <NavTabRow />
        </nav>
    );
}

/** Barra inferior embebida dentro del frame tipo mobile en desktop (layout Paisanos). */
export function EmbeddedBottomNav() {
    return (
        <nav
            aria-label="Navegación del panel"
            className="hidden w-full shrink-0 border-t border-border bg-background/90 backdrop-blur-md lg:block"
        >
            <NavTabRow />
        </nav>
    );
}

/** Sidebar expandida — solo desktop (≥lg) en rutas secundarias fuera del shell unificado. */
function SideNav() {
    const activeTab = useActiveTab();

    return (
        <nav
            className="fixed left-0 top-0 z-[100] hidden h-dvh w-60 flex-col border-r border-border bg-background/90 backdrop-blur-xl lg:flex"
            aria-label="Navegación principal"
        >
            <Link
                href="/"
                aria-label="Bondi MDP — Ir a la página principal"
                title="Bondi MDP"
                className="flex h-16 shrink-0 items-center gap-2.5 px-5 text-foreground transition-opacity hover:opacity-80"
            >
                <IconBus />
                <BrandLogo size="sm" />
            </Link>

            <div className="flex flex-1 flex-col gap-1 px-3 pt-3">
                {NAV_ITEMS.map(({ id, label, href, icon }) => {
                    const isActive = activeTab === id;
                    return (
                        <Link
                            key={id}
                            href={href}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                                "relative flex min-h-11 items-center gap-3.5 rounded-xl px-4 py-3 font-sans text-[14px] font-medium tracking-tight transition-colors",
                                isActive
                                    ? "bg-foreground/[0.06] text-secondary dark:text-amarillo"
                                    : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                            )}
                        >
                            <span
                                aria-hidden
                                className={cn(
                                    "absolute -left-3 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-secondary dark:bg-amarillo transition-opacity duration-200",
                                    isActive ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {icon(isActive)}
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </div>

            <div className="flex flex-col gap-1 px-3 pb-4">
                <PlayStoreNavLink variant="row" />
                <div className="flex items-center px-2 pt-1">
                    <ThemeToggle />
                </div>
            </div>
        </nav>
    );
}

export function BottomNav({ hideSideNav = false }: { hideSideNav?: boolean }) {
    return (
        <>
            <MobileBar />
            {!hideSideNav ? <SideNav /> : null}
        </>
    );
}
