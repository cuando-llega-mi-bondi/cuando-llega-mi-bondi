"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconBus } from "./icons/IconBus";

interface HeaderProps {
    tab: "buscar" | "favoritos";
    setTab: (t: "buscar" | "favoritos") => void;
    favCount: number;
}

export function Header({ tab, setTab, favCount }: HeaderProps) {
    const router = useRouter();
    // Skip SSR entirely for the header content to avoid hydration mismatches
    // caused by browser extensions or varying server/client environments.
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    return (
        <header style={{
            paddingTop: "calc(16px + env(safe-area-inset-top, 0px))",
            paddingRight: "calc(20px + env(safe-area-inset-right, 0px))",
            paddingBottom: "0px",
            paddingLeft: "calc(20px + env(safe-area-inset-left, 0px))",
            borderBottomWidth: "1px",
            borderBottomStyle: "solid",
            borderBottomColor: "var(--border)",
            background: "var(--surface)",
            minHeight: "90px",
            display: "block",
            width: "100%",
            boxSizing: "border-box",
        }}>
            {mounted ? (
                <div style={{ maxWidth: 520, margin: "0 auto" }}>
                    {/* Logo row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{
                            background: "var(--accent)", borderRadius: 8, padding: "5px 8px",
                            color: "#000", display: "flex",
                        }}>
                            <IconBus />
                        </div>
                        <div>
                            <p style={{
                                fontFamily: "var(--display)", fontWeight: 900, fontSize: 22, letterSpacing: 1, lineHeight: 1,
                                margin: 0, padding: 0, textTransform: "uppercase",
                            }}>
                                ¿CUÁNDO LLEGA?
                            </p>
                            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-dim)", letterSpacing: 2 }}>
                                MAR DEL PLATA · TIEMPO REAL
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: "flex", gap: 0 }}>
                        {(["buscar", "favoritos"] as const).map(t => (
                            <button key={t} onClick={() => setTab(t)} style={{
                                flex: 1, minHeight: 44, padding: "10px 0", background: "none", border: "none",
                                borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                                color: tab === t ? "var(--accent)" : "var(--text-dim)",
                                fontFamily: "var(--display)", fontWeight: 700, fontSize: 15, letterSpacing: 1,
                                cursor: "pointer", transition: "all 0.15s", textTransform: "uppercase",
                            }}>
                                {t === "buscar" ? "Buscar" : `Favoritos (${favCount})`}
                            </button>
                        ))}
                        <button onClick={() => router.push("/recorrido")} style={{
                            flex: 1, minHeight: 44, padding: "10px 0", background: "none", border: "none",
                            borderBottom: "2px solid transparent",
                            color: "var(--text-dim)",
                            fontFamily: "var(--display)", fontWeight: 700, fontSize: 15, letterSpacing: 1,
                            cursor: "pointer", transition: "color 0.15s", textTransform: "uppercase",
                        }}>
                            Mapa
                        </button>
                    </div>
                </div>
            ) : null}
        </header>
    );
}
