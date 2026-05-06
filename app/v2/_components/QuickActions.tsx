"use client";

import Link from "next/link";
import { motion } from "motion/react";

const ACTIONS = [
  {
    href: "/v2/buscar",
    label: "Buscar",
    sub: "líneas · paradas · lugares",
    accent: "#0099FF",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/v2/como-llego",
    label: "Cómo llego",
    sub: "ruta paso a paso",
    accent: "#FFD60A",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M5 11.5 12 4l7 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 4v16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="20" r="1.4" fill="currentColor" />
      </svg>
    ),
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 px-5">
      {ACTIONS.map((a, i) => (
        <motion.div
          key={a.href}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href={a.href}
            className="group flex h-full flex-col justify-between rounded-2xl border border-[#E8E2D2] bg-white p-4 v2-card-shadow transition hover:border-[#0F1115]"
          >
            <div
              className="grid h-9 w-9 place-items-center rounded-xl text-[#0F1115]"
              style={{ background: a.accent + "22", color: a.accent === "#FFD60A" ? "#0F1115" : a.accent }}
            >
              {a.icon}
            </div>
            <div className="mt-3">
              <p className="font-display text-[16px] font-semibold leading-tight text-[#0F1115]">
                {a.label}
              </p>
              <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-wider text-[#6B7080]">
                {a.sub}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
