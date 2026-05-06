"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

type Item = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const ICON = "h-[22px] w-[22px]";
const SW = 1.7;

const items: Item[] = [
  {
    href: "/v2",
    label: "Inicio",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={ICON}>
        <path d="M4 11.5L12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" stroke="currentColor" strokeWidth={SW} strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/v2/buscar",
    label: "Buscar",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={ICON}>
        <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth={SW} />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/v2/como-llego",
    label: "Cómo llego",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={ICON}>
        <path d="M12 2v4M12 22v-4M22 12h-4M6 12H2" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" />
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth={SW} />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/v2/rutinas",
    label: "Rutinas",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={ICON}>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={SW} />
        <path d="M12 7v5l3 2.5" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/v2/favoritos",
    label: "Favoritos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className={ICON}>
        <path d="M12 4.5c-1.5-2-4.5-2.5-6.5-.5-2 2-1.7 5.2.5 7.4L12 18l6-6.6c2.2-2.2 2.5-5.4.5-7.4-2-2-5-1.5-6.5.5z" stroke="currentColor" strokeWidth={SW} strokeLinejoin="round" />
      </svg>
    ),
  },
];

/** Sub-rutas que cuentan como parte de un tab para mantenerlo activo. */
const SUBROUTES: Record<string, string[]> = {
  "/v2/buscar": ["/v2/parada", "/v2/linea"],
};

function matchesTab(pathname: string, href: string): boolean {
  if (href === "/v2") return pathname === "/v2";
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  return (SUBROUTES[href] ?? []).some(
    (sub) => pathname === sub || pathname.startsWith(`${sub}/`),
  );
}

export function BottomNav() {
  const pathname = usePathname() ?? "/v2";
  const activeIdx = items.findIndex((it) => matchesTab(pathname, it.href));

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-2"
      style={{
        background:
          "linear-gradient(to top, rgba(250,247,240,0.95) 65%, rgba(250,247,240,0))",
      }}
    >
      <div
        className="relative mx-auto flex w-full max-w-md items-stretch justify-between rounded-[28px] border border-[#E8E2D2]/80 bg-white/85 p-1.5 backdrop-blur-xl"
        style={{
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.9) inset, 0 22px 50px -22px rgba(15,17,21,0.25), 0 4px 12px -6px rgba(0,153,255,0.1)",
        }}
      >
        {activeIdx >= 0 ? (
          <motion.div
            layoutId="bottom-nav-pill"
            className="absolute top-1.5 bottom-1.5 rounded-[22px] bg-[#0F1115]"
            style={{
              width: `calc((100% - 12px) / ${items.length})`,
              left: `calc(6px + ${activeIdx} * (100% - 12px) / ${items.length})`,
            }}
            transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.7 }}
          />
        ) : null}
        {items.map((it, i) => {
          const isActive = i === activeIdx;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`relative z-10 flex flex-1 flex-col items-center justify-center gap-1 rounded-[22px] py-2 text-[10.5px] font-medium tracking-tight transition-colors ${
                isActive ? "text-[#FFD60A]" : "text-[#6B7080]"
              }`}
            >
              <span className={isActive ? "text-[#FFD60A]" : "text-[#0F1115]"}>{it.icon}</span>
              <span className="font-mono uppercase leading-none">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
