"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

type ConfirmOptions = {
    title: string;
    body?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** "danger" pinta el botón confirmar en rojo (para borrados). */
    tone?: "default" | "danger";
};

type Resolver = (ok: boolean) => void;

const Ctx = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const [opts, setOpts] = useState<ConfirmOptions | null>(null);
    const resolverRef = useRef<Resolver | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const confirm = useCallback((next: ConfirmOptions): Promise<boolean> => {
        return new Promise<boolean>((resolve) => {
            resolverRef.current?.(false); // resolver previo si hubiera uno colgado
            resolverRef.current = resolve;
            setOpts(next);
            setOpen(true);
        });
    }, []);

    const close = useCallback((value: boolean) => {
        resolverRef.current?.(value);
        resolverRef.current = null;
        setOpen(false);
    }, []);

    // Cerrar con Escape
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close(false);
            if (e.key === "Enter") close(true);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, close]);

    return (
        <Ctx.Provider value={confirm}>
            {children}
            {mounted
                ? createPortal(
                      <AnimatePresence>
                          {open && opts ? (
                              <motion.div
                                  key="confirm-backdrop"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.15 }}
                                  onClick={() => close(false)}
                                  className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                              >
                                  <motion.div
                                      key="confirm-card"
                                      initial={{ y: 60, opacity: 0, scale: 0.96 }}
                                      animate={{ y: 0, opacity: 1, scale: 1 }}
                                      exit={{ y: 30, opacity: 0, scale: 0.98 }}
                                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                      onClick={(e) => e.stopPropagation()}
                                      role="dialog"
                                      aria-modal="true"
                                      aria-labelledby="confirm-title"
                                      className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl"
                                  >
                                      <div className="flex items-start gap-3">
                                          <span
                                              className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
                                                  opts.tone === "danger"
                                                      ? "bg-[#FFE2E2] text-[#A02525]"
                                                      : "bg-[#EAF6FF] text-[#0099FF]"
                                              }`}
                                          >
                                              {opts.tone === "danger" ? (
                                                  <svg
                                                      viewBox="0 0 24 24"
                                                      fill="none"
                                                      className="h-5 w-5"
                                                  >
                                                      <path
                                                          d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                                                          stroke="currentColor"
                                                          strokeWidth="1.7"
                                                          strokeLinecap="round"
                                                          strokeLinejoin="round"
                                                      />
                                                  </svg>
                                              ) : (
                                                  <svg
                                                      viewBox="0 0 24 24"
                                                      fill="none"
                                                      className="h-5 w-5"
                                                  >
                                                      <path
                                                          d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                          stroke="currentColor"
                                                          strokeWidth="1.7"
                                                          strokeLinecap="round"
                                                      />
                                                  </svg>
                                              )}
                                          </span>
                                          <div className="min-w-0 flex-1">
                                              <h2
                                                  id="confirm-title"
                                                  className="font-display text-[17px] font-semibold leading-tight text-[#0F1115]"
                                              >
                                                  {opts.title}
                                              </h2>
                                              {opts.body ? (
                                                  <p className="mt-1 text-[13.5px] leading-snug text-[#6B7080]">
                                                      {opts.body}
                                                  </p>
                                              ) : null}
                                          </div>
                                      </div>

                                      <div className="mt-5 grid grid-cols-2 gap-2">
                                          <button
                                              type="button"
                                              onClick={() => close(false)}
                                              className="rounded-2xl border border-[#E8E2D2] bg-white py-3 font-display text-[14px] font-semibold text-[#0F1115] transition active:scale-[0.99] hover:bg-[#FAF7F0]"
                                          >
                                              {opts.cancelLabel ?? "Cancelar"}
                                          </button>
                                          <button
                                              type="button"
                                              autoFocus
                                              onClick={() => close(true)}
                                              style={{
                                                  backgroundColor:
                                                      opts.tone === "danger" ? "#D72020" : "#0099FF",
                                                  color: "#FFFFFF",
                                                  boxShadow:
                                                      opts.tone === "danger"
                                                          ? "0 18px 40px -18px rgba(215,32,32,0.7)"
                                                          : "0 18px 40px -18px rgba(0,153,255,0.7)",
                                              }}
                                              className="rounded-2xl py-3 font-display text-[14px] font-semibold transition active:scale-[0.99] hover:brightness-110"
                                          >
                                              {opts.confirmLabel ?? "Confirmar"}
                                          </button>
                                      </div>
                                  </motion.div>
                              </motion.div>
                          ) : null}
                      </AnimatePresence>,
                      document.body,
                  )
                : null}
        </Ctx.Provider>
    );
}

export function useConfirm() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useConfirm requiere <ConfirmDialogProvider>");
    return ctx;
}
