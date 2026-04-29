"use client";

import { useState, useEffect, useRef, useId, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { IconChevron } from "./icons/IconChevron";
import { cn } from "@/lib/utils";

export function Combobox({
    placeholder,
    value,
    onChange,
    options,
    disabled = false,
    loading = false,
    autoSelectSingleFilterMatch = true,
    "aria-labelledby": ariaLabelledby,
    "aria-label": ariaLabel,
}: {
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    disabled?: boolean;
    loading?: boolean;
    /** When the filter narrows to one option, select it after a short delay */
    autoSelectSingleFilterMatch?: boolean;
    "aria-labelledby"?: string;
    "aria-label"?: string;
}) {
    const reactId = useId();
    const listboxId = `cb-list-${reactId}`;
    const baseId = `cb-trigger-${reactId}`;

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const [dropdownRect, setDropdownRect] = useState<{
        top: number;
        left: number;
        width: number;
    } | null>(null);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const portalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

    const showFilter = options.length > 8;

    const filtered = useMemo(() => {
        return query
            ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())).slice(0, 40)
            : options.slice(0, 80);
    }, [options, query]);

    const singleFilteredValue =
        filtered.length === 1 ? filtered[0].value : null;

    const selected = options.find((o) => o.value === value);

    const close = useCallback(() => {
        setOpen(false);
        setQuery("");
        setActiveIndex(0);
    }, []);

    const computeRect = useCallback(() => {
        if (!triggerRef.current) return;
        const r = triggerRef.current.getBoundingClientRect();
        setDropdownRect({ top: r.bottom + 6, left: r.left, width: r.width });
    }, []);

    const openList = useCallback(() => {
        if (disabled) return;
        computeRect();
        setOpen(true);
        setQuery("");
        const visible = options.slice(0, 80);
        const idx = visible.findIndex((o) => o.value === value);
        setActiveIndex(idx >= 0 ? idx : 0);
    }, [disabled, options, value, computeRect]);

    // Close on outside click — must check both wrapper and portal
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                wrapperRef.current?.contains(target) ||
                portalRef.current?.contains(target)
            ) return;
            close();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [close]);

    // Close and recompute position on scroll/resize
    useEffect(() => {
        if (!open) return;
        const onScroll = (e: Event) => {
            if (portalRef.current?.contains(e.target as Node)) return;
            close();
        };
        const onResize = () => computeRect();
        window.addEventListener("scroll", onScroll, true);
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("scroll", onScroll, true);
            window.removeEventListener("resize", onResize);
        };
    }, [open, close, computeRect]);

    useEffect(() => {
        if (!open) return;
        if (showFilter) {
            const isCoarsePointer =
                typeof window !== "undefined" &&
                typeof window.matchMedia === "function" &&
                window.matchMedia("(pointer: coarse)").matches;
            if (isCoarsePointer) return;
            const t = window.setTimeout(() => inputRef.current?.focus(), 50);
            return () => window.clearTimeout(t);
        }
        triggerRef.current?.focus();
    }, [open, showFilter]);

    const safeActiveIndex =
        filtered.length === 0
            ? -1
            : Math.min(Math.max(0, activeIndex), filtered.length - 1);

    useEffect(() => {
        if (!open || safeActiveIndex < 0) return;
        const el = optionRefs.current[safeActiveIndex];
        el?.scrollIntoView({ block: "nearest" });
    }, [safeActiveIndex, open]);

    useEffect(() => {
        if (!autoSelectSingleFilterMatch || !open || !showFilter || disabled || loading) return;
        if (!query.trim() || singleFilteredValue == null) return;

        const tid = window.setTimeout(() => {
            if (singleFilteredValue !== value) {
                onChange(singleFilteredValue);
            }
            setOpen(false);
            setQuery("");
            setActiveIndex(0);
            triggerRef.current?.focus();
        }, 350);

        return () => window.clearTimeout(tid);
    }, [
        autoSelectSingleFilterMatch,
        open,
        showFilter,
        disabled,
        loading,
        query,
        singleFilteredValue,
        value,
        onChange,
    ]);

    const handleSelect = useCallback(
        (v: string) => {
            onChange(v);
            close();
            triggerRef.current?.focus();
        },
        [onChange, close]
    );

    const moveActive = useCallback(
        (delta: number) => {
            if (filtered.length === 0) return;
            setActiveIndex((i) => {
                const base = Math.min(Math.max(0, i), filtered.length - 1);
                let next = base + delta;
                if (next < 0) next = filtered.length - 1;
                if (next >= filtered.length) next = 0;
                return next;
            });
        },
        [filtered.length]
    );

    const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (disabled) return;
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                if (!open) openList();
                else moveActive(1);
                break;
            case "ArrowUp":
                e.preventDefault();
                if (!open) openList();
                else moveActive(-1);
                break;
            case "Enter":
            case " ":
                if (open && safeActiveIndex >= 0 && filtered[safeActiveIndex]) {
                    e.preventDefault();
                    handleSelect(filtered[safeActiveIndex].value);
                } else if (e.key === "Enter" && !open) {
                    e.preventDefault();
                    openList();
                }
                break;
            case "Escape":
                if (open) {
                    e.preventDefault();
                    close();
                }
                break;
            case "Home":
                if (open) {
                    e.preventDefault();
                    setActiveIndex(0);
                }
                break;
            case "End":
                if (open) {
                    e.preventDefault();
                    setActiveIndex(Math.max(0, filtered.length - 1));
                }
                break;
            default:
                break;
        }
    };

    const onFilterKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open) return;
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                moveActive(1);
                break;
            case "ArrowUp":
                e.preventDefault();
                moveActive(-1);
                break;
            case "Enter":
                if (safeActiveIndex >= 0 && filtered[safeActiveIndex]) {
                    e.preventDefault();
                    handleSelect(filtered[safeActiveIndex].value);
                }
                break;
            case "Escape":
                e.preventDefault();
                close();
                triggerRef.current?.focus();
                break;
            case "Home":
                e.preventDefault();
                setActiveIndex(0);
                break;
            case "End":
                e.preventDefault();
                setActiveIndex(Math.max(0, filtered.length - 1));
                break;
            default:
                break;
        }
    };

    const handleTriggerClick = () => {
        if (disabled) return;
        if (open) close();
        else openList();
    };

    const activeDescendantId =
        open && safeActiveIndex >= 0 && filtered[safeActiveIndex]
            ? `${listboxId}-opt-${filtered[safeActiveIndex].value}`
            : undefined;

    const comboboxLabelProps =
        ariaLabelledby !== undefined
            ? { "aria-labelledby": ariaLabelledby }
            : ariaLabel !== undefined
              ? { "aria-label": ariaLabel }
              : {};

    const dropdown =
        open && dropdownRect
            ? createPortal(
                  <div
                      ref={portalRef}
                      id={listboxId}
                      role="listbox"
                      aria-label="Opciones"
                      style={{
                          position: "fixed",
                          top: dropdownRect.top,
                          left: dropdownRect.left,
                          width: dropdownRect.width,
                          zIndex: 9999,
                      }}
                      className="overflow-hidden rounded-2xl border border-border bg-background/95 shadow-lg backdrop-blur-md"
                  >
                      {showFilter ? (
                          <div className="border-b border-border px-2.5 py-2">
                              <input
                                  ref={inputRef}
                                  value={query}
                                  onChange={(e) => {
                                      setQuery(e.target.value);
                                      setActiveIndex(0);
                                  }}
                                  onKeyDown={onFilterKeyDown}
                                  placeholder="Buscar..."
                                  aria-label="Filtrar opciones"
                                  className="min-h-10 w-full rounded-xl border border-border bg-input px-3 py-2 font-sans text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-secondary"
                              />
                          </div>
                      ) : null}

                      <div className="max-h-[220px] overflow-y-auto">
                          {filtered.length === 0 ? (
                              <div className="px-4 py-3 font-sans text-sm text-muted-foreground">
                                  Sin resultados
                              </div>
                          ) : (
                              filtered.map((o, i) => {
                                  const isActive = i === safeActiveIndex;
                                  const isSelected = o.value === value;
                                  const optId = `${listboxId}-opt-${o.value}`;

                                  return (
                                      <div
                                          key={o.value}
                                          ref={(el) => {
                                              optionRefs.current[i] = el;
                                          }}
                                          id={optId}
                                          role="option"
                                          aria-selected={isSelected}
                                          tabIndex={-1}
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => handleSelect(o.value)}
                                          onMouseEnter={() => setActiveIndex(i)}
                                          className={cn(
                                              "flex min-h-11 w-full cursor-pointer items-center px-4 py-3 text-left font-sans text-[14px] font-medium tracking-[-0.01em] transition-colors",
                                              isActive
                                                  ? "bg-muted text-foreground"
                                                  : isSelected
                                                    ? "bg-secondary/15 text-secondary"
                                                    : "bg-transparent text-foreground",
                                          )}
                                      >
                                          {o.label}
                                      </div>
                                  );
                              })
                          )}
                      </div>
                  </div>,
                  document.body,
              )
            : null;

    return (
        <div ref={wrapperRef} className="relative w-full">
            <button
                ref={triggerRef}
                id={baseId}
                type="button"
                role="combobox"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-haspopup="listbox"
                aria-autocomplete="list"
                {...(activeDescendantId
                    ? { "aria-activedescendant": activeDescendantId }
                    : {})}
                {...comboboxLabelProps}
                onClick={handleTriggerClick}
                onKeyDown={onTriggerKeyDown}
                disabled={disabled}
                className={cn(
                    "input flex min-h-11 w-full items-center justify-between rounded-full border bg-input px-4 py-2.5 font-sans text-[15px] font-medium tracking-tight transition-colors",
                    selected ? "text-foreground" : "text-muted-foreground",
                    disabled
                        ? "cursor-not-allowed border-border opacity-50"
                        : open
                          ? "cursor-pointer border-secondary shadow-[0_0_0_3px_rgba(29,117,112,0.25)]"
                          : "cursor-pointer border-border hover:border-secondary",
                )}
            >
                <span>{loading ? "Cargando..." : selected?.label ?? placeholder}</span>
                <IconChevron open={open} />
            </button>

            {dropdown}
        </div>
    );
}
