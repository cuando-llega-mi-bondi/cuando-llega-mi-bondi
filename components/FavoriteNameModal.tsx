"use client";

import { useState, useEffect, useRef } from "react";
import { IconX } from "./icons/IconX";

interface FavoriteNameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
    initialName: string;
    title: string;
}

export function FavoriteNameModal({ isOpen, onClose, onSave, initialName, title }: FavoriteNameModalProps) {
    const [name, setName] = useState(initialName);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setName(initialName);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, initialName]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20, zIndex: 1000,
        }}>
            {/* Backdrop Layer (Separated to avoid animating blur) */}
            <div 
                onClick={onClose}
                style={{
                    position: "absolute", inset: 0,
                    background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
                    animation: "overlayFadeIn 0.3s ease-out forwards",
                    willChange: "opacity",
                }} 
            />

            {/* Modal Content */}
            <div style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 20, width: "100%", maxWidth: 400,
                padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                position: "relative", zIndex: 1,
                animation: "contentShow 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                willChange: "transform, opacity",
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute", top: 16, right: 16,
                        background: "none", border: "none", color: "var(--text-dim)",
                        cursor: "pointer", padding: 4,
                    }}
                >
                    <IconX size={20} />
                </button>

                <h3 style={{
                    fontFamily: "var(--display)", fontSize: 20, fontWeight: 800,
                    marginBottom: 8, color: "var(--text)", letterSpacing: -0.5,
                }}>
                    {title}
                </h3>
                <p style={{
                    fontFamily: "var(--mono)", fontSize: 13, color: "var(--text-muted)",
                    marginBottom: 20, lineHeight: 1.5,
                }}>
                    Asignale un nombre descriptivo a esta parada para encontrarla más rápido.
                </p>

                <div style={{ marginBottom: 24 }}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") onSave(name);
                            if (e.key === "Escape") onClose();
                        }}
                        placeholder="Ej: Mi Casa, Trabajo..."
                        style={{
                            width: "100%", background: "rgba(255,255,255,0.05)",
                            border: "2px solid var(--border)", borderRadius: 12,
                            padding: "12px 16px", color: "var(--text)",
                            fontFamily: "var(--display)", fontWeight: 600, fontSize: 16,
                            outline: "none", transition: "border-color 0.2s",
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = "var(--accent)"}
                        onBlur={e => e.currentTarget.style.borderColor = "var(--border)"}
                    />
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, background: "none", border: "1px solid var(--border)",
                            borderRadius: 12, padding: "12px", color: "var(--text-dim)",
                            fontFamily: "var(--display)", fontWeight: 700, cursor: "pointer",
                            transition: "background 0.2s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                        CANCELAR
                    </button>
                    <button
                        onClick={() => onSave(name)}
                        style={{
                            flex: 1, background: "var(--accent)", border: "none",
                            borderRadius: 12, padding: "12px", color: "#000",
                            fontFamily: "var(--display)", fontWeight: 900, cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(245,166,35,0.3)",
                        }}
                    >
                        GUARDAR
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes overlayFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes contentShow {
                    from { opacity: 0; transform: scale(0.9) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
}
