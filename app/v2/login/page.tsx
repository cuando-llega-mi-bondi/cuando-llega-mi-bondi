"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { useBondiAuth } from "@/lib/bondi-api/AuthContext";
import { ApiError } from "@/lib/bondi-api";

const ERROR_LABELS: Record<string, string> = {
    invalid_credentials: "Email o contraseña incorrectos",
    no_api_url: "API no configurada (NEXT_PUBLIC_BONDI_API_URL)",
};

export default function LoginPage() {
    const router = useRouter();
    const params = useSearchParams();
    const next = params.get("next") || "/v2";
    const { state, login } = useBondiAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorCode, setErrorCode] = useState<string | null>(null);

    // Si ya está logueado, mandalo a destino.
    useEffect(() => {
        if (state.status === "authenticated") {
            router.replace(next);
        }
    }, [state.status, router, next]);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (submitting) return;
        setErrorCode(null);
        setSubmitting(true);
        try {
            await login(email.trim(), password);
            router.replace(next);
        } catch (err) {
            if (err instanceof ApiError) {
                setErrorCode(err.code);
            } else {
                setErrorCode("network_error");
            }
            setSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-[80dvh] flex-col justify-center px-5">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
            >
                <header>
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[#6B7080]">
                        Tu cuenta
                    </p>
                    <h1 className="mt-1 font-display text-[34px] font-semibold leading-[1.05] tracking-tight text-[#0F1115]">
                        Iniciá <span className="text-[#0099FF]">sesión</span>
                    </h1>
                    <p className="mt-2 text-[14px] leading-snug text-[#6B7080]">
                        Para guardar favoritos y configurar avisos de bondi.
                    </p>
                </header>

                <form
                    onSubmit={onSubmit}
                    className="rounded-3xl border border-[#E8E2D2] bg-white p-5 v2-card-shadow"
                >
                    <div className="space-y-4">
                        <Field
                            id="email"
                            type="email"
                            label="Email"
                            value={email}
                            onChange={setEmail}
                            autoComplete="email"
                            required
                        />
                        <Field
                            id="password"
                            type="password"
                            label="Contraseña"
                            value={password}
                            onChange={setPassword}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {errorCode ? (
                        <p className="mt-3 rounded-xl border border-[#F5C2C7] bg-[#FFF5F5] px-3 py-2 font-mono text-[11.5px] text-[#A02525]">
                            {ERROR_LABELS[errorCode] ?? `Error: ${errorCode}`}
                        </p>
                    ) : null}

                    <button
                        type="submit"
                        disabled={submitting || !email || !password}
                        className="mt-5 w-full rounded-2xl bg-[#0099FF] py-4 font-display text-[15px] font-semibold text-white shadow-[0_18px_40px_-18px_rgba(0,153,255,0.7)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#9DB6CC] disabled:shadow-none"
                    >
                        {submitting ? "Entrando…" : "Entrar"}
                    </button>
                </form>

                <p className="px-1 text-center font-mono text-[11px] text-[#6B7080]">
                    Usamos tu cuenta de aeterna. Sin password nuevo.
                </p>
            </motion.div>
        </div>
    );
}

function Field({
    id,
    type,
    label,
    value,
    onChange,
    autoComplete,
    required,
}: {
    id: string;
    type: "email" | "password" | "text";
    label: string;
    value: string;
    onChange: (v: string) => void;
    autoComplete?: string;
    required?: boolean;
}) {
    return (
        <label htmlFor={id} className="block">
            <span className="mb-1 block font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
                {label}
            </span>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoComplete={autoComplete}
                required={required}
                className="w-full rounded-xl border border-[#E8E2D2] bg-[#FAF7F0] px-3 py-3 font-display text-[15px] text-[#0F1115] outline-none focus:border-[#0099FF] focus:bg-white"
            />
        </label>
    );
}
