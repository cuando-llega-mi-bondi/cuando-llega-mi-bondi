"use client";

import { useState } from "react";
import { supabase } from "@shared/infra/supabase";
import { Modal } from "@shared/ui/Modal";
import { Button } from "@shared/ui/Button";
import { toast } from "@shared/ui/store/useToastStore";
import { MOCK_REVIEWS_ENABLED } from "../mockReviews";
import { useMockAuthStore } from "../mockAuthStore";

interface SignInModalProps {
    open: boolean;
    onClose: () => void;
}

export function SignInModal({ open, onClose }: SignInModalProps) {
    const [email, setEmail] = useState("");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleSend() {
        if (!email.trim() || sending) return;

        // En modo mock no hay backend real: "iniciar sesión" es instantáneo.
        if (MOCK_REVIEWS_ENABLED) {
            useMockAuthStore.getState().setSignedIn(true);
            handleClose();
            return;
        }

        setSending(true);
        const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: { emailRedirectTo: window.location.href },
        });
        setSending(false);
        if (error) {
            toast({ title: "No pudimos enviar el link", description: error.message, variant: "error" });
            return;
        }
        setSent(true);
    }

    function handleClose() {
        setEmail("");
        setSent(false);
        onClose();
    }

    return (
        <Modal open={open} onClose={handleClose}>
            {sent ? (
                <div className="space-y-2 text-center">
                    <p className="font-sans text-sm font-semibold text-foreground">Revisá tu email</p>
                    <p className="font-sans text-[13px] text-muted-foreground">
                        Te mandamos un link a {email} para iniciar sesión y dejar tu reseña.
                    </p>
                    <Button variant="secondary" size="sm" onClick={handleClose} className="mt-2">
                        Listo
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="font-sans text-sm font-semibold text-foreground">Iniciá sesión para reseñar</p>
                    <p className="font-sans text-[13px] text-muted-foreground">
                        Te mandamos un link mágico por email, sin contraseñas.
                    </p>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="tu@email.com"
                        autoFocus
                        className="input w-full"
                    />
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSend}
                        disabled={!email.trim() || sending}
                        className="w-full"
                    >
                        {sending ? "Enviando…" : "Enviarme el link"}
                    </Button>
                </div>
            )}
        </Modal>
    );
}
