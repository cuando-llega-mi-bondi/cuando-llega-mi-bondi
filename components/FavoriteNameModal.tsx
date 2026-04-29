"use client";

import { useEffect, useRef } from "react";
import { IconX } from "./icons/IconX";
import { Button, Modal } from "@/components/ui";

interface FavoriteNameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
    initialName: string;
    title: string;
}

export function FavoriteNameModal({ isOpen, onClose, onSave, initialName, title }: FavoriteNameModalProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <Modal open={isOpen} onClose={onClose} className="animate-slide-up">
            <button
                onClick={onClose}
                className="absolute right-4 top-4 cursor-pointer rounded-full border border-border bg-muted p-1 text-muted-foreground transition-colors hover:border-secondary hover:text-foreground"
                aria-label="Cerrar"
            >
                <IconX size={20} />
            </button>

            <h3 className="mb-2 font-display text-[22px] font-medium tracking-[-1px] text-foreground">
                {title}
            </h3>
            <p className="mb-5 font-sans text-sm leading-relaxed text-muted-foreground">
                Asignale un nombre descriptivo a esta parada para encontrarla más rápido.
            </p>

            <div className="mb-6">
                <input
                    ref={inputRef}
                    key={initialName}
                    type="text"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") onSave(inputRef.current?.value ?? initialName);
                        if (e.key === "Escape") onClose();
                    }}
                    defaultValue={initialName}
                    placeholder="Ej: Mi Casa, Trabajo..."
                    className="w-full rounded-2xl border border-border bg-input px-4 py-3 font-sans text-base font-medium tracking-tight text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-secondary"
                />
            </div>

            <div className="flex gap-3">
                <Button
                    onClick={onClose}
                    variant="secondary"
                    size="md"
                    className="flex-1 text-muted-foreground"
                >
                    CANCELAR
                </Button>
                <Button
                    onClick={() => onSave(inputRef.current?.value ?? initialName)}
                    variant="accent"
                    size="md"
                    className="flex-1"
                >
                    GUARDAR
                </Button>
            </div>
        </Modal>
    );
}
