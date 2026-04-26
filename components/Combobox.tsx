"use client";

import { useState, useEffect, useRef, useId, useCallback, useMemo } from "react";
import { IconChevron } from "./icons/IconChevron";

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
        <div ref={ref} style={{ position: "relative", width: "100%" }}>
            <button
                ref={triggerRef}
                id={baseId}
                type="button"
                role="combobox"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-haspopup="listbox"
                aria-autocomplete="list"
                {...(activeDescendantId ? { "aria-activedescendant": activeDescendantId } : {})}
                {...comboboxLabelProps}
                onClick={handleTriggerClick}
                onKeyDown={onTriggerKeyDown}
                disabled={disabled}
                style={{
                    width: "100%",
                    minHeight: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: selected ? "var(--text)" : "var(--text-dim)",
                    fontFamily: "var(--display)",
                    fontSize: 16,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                    transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                    if (!disabled)
                        (e.currentTarget as HTMLElement).style.borderColor =
                            "var(--accent)";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                        "var(--border)";
                }}
            >
                <span>{loading ? "Cargando..." : selected?.label ?? placeholder}</span>
                <IconChevron open={open} />
            </button>

            {open && (
                <div
                    id={listboxId}
                    role="listbox"
                    aria-label="Opciones"
                    style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        background: "var(--surface2)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                        overflow: "hidden",
                    }}
                >
                    {showFilter && (
                        <div
                            style={{
                                padding: "8px 10px",
                                borderBottom: "1px solid var(--border)",
                            }}
                        >
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
                                style={{
                                    width: "100%",
                                    minHeight: 40,
                                    background: "var(--bg)",
                                    border: "1px solid var(--border)",
                                    borderRadius: 6,
                                    color: "var(--text)",
                                    padding: "8px 10px",
                                    fontFamily: "var(--mono)",
                                    fontSize: 13,
                                    outline: "none",
                                }}
                            />
                        </div>
                    )}
                    <div style={{ maxHeight: 220, overflowY: "auto" }}>
                        {filtered.length === 0 ? (
                            <div
                                style={{
                                    padding: "12px 14px",
                                    color: "var(--text-dim)",
                                    fontSize: 14,
                                    fontFamily: "var(--mono)",
                                }}
                            >
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
                                        style={{
                                            width: "100%",
                                            textAlign: "left",
                                            padding: "12px 14px",
                                            minHeight: 44,
                                            display: "flex",
                                            alignItems: "center",
                                            boxSizing: "border-box",
                                            background: isActive
                                                ? "rgba(255,255,255,0.08)"
                                                : isSelected
                                                  ? "rgba(245,166,35,0.12)"
                                                  : "transparent",
                                            color: isSelected
                                                ? "var(--accent)"
                                                : "var(--text)",
                                            fontFamily: "var(--display)",
                                            fontSize: 15,
                                            fontWeight: 600,
                                            border: "none",
                                            cursor: "pointer",
                                            transition: "background 0.1s",
                                        }}
                                        onMouseEnter={() => setActiveIndex(i)}
                                    >
                                        {o.label}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
