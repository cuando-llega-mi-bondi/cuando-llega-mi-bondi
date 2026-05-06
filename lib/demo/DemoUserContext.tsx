"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { DemoRoutine, DemoUser } from "./types";
import { DEMO_USER } from "./data";

type Ctx = {
  user: DemoUser;
  toggleRoutine: (id: string) => void;
  cacheLatencyMs: number;
};

const DemoUserCtx = createContext<Ctx | null>(null);

export function DemoUserProvider({ children }: { children: React.ReactNode }) {
  const [routines, setRoutines] = useState(DEMO_USER.rutinas);

  const value = useMemo<Ctx>(() => {
    const user: DemoUser = { ...DEMO_USER, rutinas: routines };
    return {
      user,
      toggleRoutine: (id) =>
        setRoutines((prev) =>
          prev.map((r): DemoRoutine => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
        ),
      cacheLatencyMs: 12,
    };
  }, [routines]);

  return <DemoUserCtx.Provider value={value}>{children}</DemoUserCtx.Provider>;
}

export function useDemoUser() {
  const ctx = useContext(DemoUserCtx);
  if (!ctx) throw new Error("useDemoUser must be used inside <DemoUserProvider>");
  return ctx;
}
