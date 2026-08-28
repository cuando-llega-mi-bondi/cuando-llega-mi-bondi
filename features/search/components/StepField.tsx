"use client";

import { Combobox } from "@features/search/components/Combobox";
import { IconCheck } from "@shared/icons/IconCheck";
import { IconChevron } from "@shared/icons/IconChevron";
import { cn } from "@shared/utils";

export type StepFieldStatus = "idle" | "active" | "completed";

interface StepFieldProps {
    labelId: string;
    stepNumber: number;
    stepText: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
    loading?: boolean;
    disabled?: boolean;
    className?: string;
    autoSelectSingleFilterMatch?: boolean;
    stepStatus?: StepFieldStatus;
    required?: boolean;
    description?: string;
}

export function StepField({
    labelId,
    stepNumber,
    stepText,
    value,
    onChange,
    options,
    placeholder,
    loading,
    disabled,
    className,
    autoSelectSingleFilterMatch,
    stepStatus = "idle",
    required,
    description,
}: StepFieldProps) {
    const isActive = stepStatus === "active";
    const isCompleted = stepStatus === "completed";

    return (
        <div className={cn("group transition-all duration-300", className)}>
            <Combobox
                aria-labelledby={labelId}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                options={options}
                loading={loading}
                disabled={disabled}
                autoSelectSingleFilterMatch={autoSelectSingleFilterMatch}
            >
                {({ open, selectedLabel, onClick, onKeyDown, ref }) => (
                    <button
                        ref={ref}
                        onClick={onClick}
                        onKeyDown={onKeyDown}
                        disabled={disabled}
                        type="button"
                        className={cn(
                            "relative flex w-full items-center gap-4 rounded-[32px] border-2 p-4 text-left transition-all duration-300 outline-none",
                            isActive
                                ? "border-amarillo bg-card shadow-lg ring-4 ring-amarillo/20"
                                : isCompleted
                                  ? "border-transparent bg-secondary/5 hover:bg-secondary/10"
                                  : "border-transparent bg-muted/40 opacity-70",
                            open && "ring-4 ring-secondary/20",
                            disabled && "cursor-not-allowed opacity-50",
                        )}
                        aria-current={isActive ? "step" : undefined}
                        aria-label={`${stepText}: ${selectedLabel || "Sin seleccionar"}. ${required ? "Requerido." : ""}`}
                    >
                        <div
                            className={cn(
                                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                                isCompleted
                                    ? "bg-secondary text-white"
                                    : isActive
                                      ? "bg-amarillo text-primary-foreground"
                                      : "bg-muted text-muted-foreground",
                            )}
                        >
                            {isCompleted ? (
                                <IconCheck className="h-6 w-6" />
                            ) : (
                                <span className="text-lg font-bold">{stepNumber}</span>
                            )}
                        </div>

                        <div className="flex flex-1 flex-col overflow-hidden">
                            <span
                                id={labelId}
                                className={cn(
                                    "font-mono text-[11px] font-bold tracking-[1.5px] uppercase",
                                    isActive ? "text-secondary" : "text-muted-foreground",
                                )}
                            >
                                {stepText}
                            </span>

                            {/* Solo cuando dice algo que el placeholder de abajo no dice ya
                                (p.ej. "Opcional" en RAMAL) — required y "elegí esto" ya se leen
                                del anillo amarillo + el círculo activo, no hace falta repetirlo. */}
                            {!isCompleted && isActive && description && (
                                <span className="mt-0.5 text-xs font-medium leading-none text-muted-foreground">
                                    {description}
                                </span>
                            )}

                            <div
                                className={cn(
                                    "mt-1 truncate font-sans text-xl font-bold tracking-tight transition-colors",
                                    isCompleted || isActive
                                        ? "text-foreground"
                                        : "text-muted-foreground",
                                )}
                            >
                                {loading ? "Cargando..." : selectedLabel || placeholder}
                            </div>
                        </div>

                        <div className="shrink-0">
                            <IconChevron
                                open={open}
                                className={cn(
                                    "h-6 w-6",
                                    isActive ? "text-amarillo" : "text-muted-foreground",
                                )}
                            />
                        </div>
                    </button>
                )}
            </Combobox>
        </div>
    );
}
