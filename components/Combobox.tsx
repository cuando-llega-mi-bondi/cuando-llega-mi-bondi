"use client";

import { useState, useEffect, useRef, useId, useCallback, useMemo } from "react";
import { IconChevron } from "./icons/IconChevron";
import { cn } from "@/lib/utils";

export function Combobox({
    placeholder,
    value,
    onChange,
    options,
    disabled = false,
    loading = false,
    "aria-labelledby": ariaLabelledby,
    "aria-label": ariaLabel,
}: {
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    disabled?: boolean;
    loading?: boolean;
    "aria-labelledby"?: string;
    "aria-label"?: string;
}) {
    const reactId = useId();
    const listboxId = `cb-list-${reactId}`;
    const baseId = `cb-trigger-${reactId}`;

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

    const showFilter = options.length > 8;

    const filtered = useMemo(() => {
        return query
            ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())).slice(0, 40)
            : options.slice(0, 80);
    }, [options, query]);

    const selected = options.find((o) => o.value === value);

    const close = useCallback(() => {
        setOpen(false);
        setQuery("");
        setActiveIndex(0);
    }, []);

    const openList = useCallback(() => {
        if (disabled) return;
        setOpen(true);
        setQuery("");
        const visible = options.slice(0, 80);
        const idx = visible.findIndex((o) => o.value === value);
        setActiveIndex(idx >= 0 ? idx : 0);
    }, [disabled, options, value]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) close();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [close]);

    useEffect(() => {
        if (!open) return;
        if (showFilter) {
            const isCoarsePointer =
                typeof window !== "undefined" &&
                typeof window.matchMedia === "function" &&
                window.matchMedia("(pointer: coarse)").matches;
            if (isCoarsePointer) {
                // En mobile no enfocamos el input para no abrir el teclado al toque.
                // El usuario puede tocar "Buscar..." si quiere filtrar.
                return;
            }
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

    return (
        <div
            ref={ref}
            className={cn(
                "relative w-full",
                // Keeps the active dropdown above neighboring fields on mobile.
                open ? "z-220" : "z-0",
            )}
        >
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
                    "flex min-h-11 w-full items-center justify-between rounded-full border bg-[rgba(255,255,255,0.05)] px-4 py-2.5 font-sans text-[15px] font-medium tracking-[-0.01em] transition-colors",
                    selected ? "text-text" : "text-text-dim",
                    disabled
                        ? "cursor-not-allowed border-white/10 opacity-50"
                        : open
                          ? "cursor-pointer border-accent shadow-[0_0_0_1px_rgba(0,153,255,0.15)]"
                          : "cursor-pointer border-white/12 hover:border-white/20",
                )}
            >
                <span>{loading ? "Cargando..." : selected?.label ?? placeholder}</span>
                <IconChevron open={open} />
            </button>

            {open ? (
                <div
                    id={listboxId}
                    role="listbox"
                    aria-label="Opciones"
                    className="absolute left-0 right-0 top-[calc(100%+6px)] z-230 overflow-hidden rounded-2xl border border-white/12 bg-black/95 shadow-[rgba(0,153,255,0.15)_0px_0px_0px_1px,0_18px_36px_rgba(0,0,0,0.65)]"
                >
                    {showFilter ? (
                        <div className="border-b border-white/10 px-2.5 py-2">
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
                                className="min-h-10 w-full rounded-xl border border-white/12 bg-[rgba(255,255,255,0.04)] px-3 py-2 font-sans text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-accent"
                            />
                        </div>
                    ) : null}

                    <div className="max-h-[220px] overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="px-4 py-3 font-sans text-sm text-text-dim">
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
                                                ? "bg-white/10 text-text"
                                                : isSelected
                                                  ? "bg-accent/15 text-accent"
                                                  : "bg-transparent text-text",
                                        )}
                                    >
                                        {o.label}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
