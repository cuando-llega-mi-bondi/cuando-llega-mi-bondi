"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReviewsUser } from "@features/reviews/hooks/useReviewsUser";
import { SignInModal } from "@features/reviews/components/SignInModal";
import { signOut, deleteAccount } from "@features/account/api/account";
import { PageShell } from "@shared/layout/PageShell";
import { PageHeader } from "@shared/layout/PageHeader";
import { BottomNav } from "@shared/layout/BottomNav";
import { Button } from "@shared/ui/Button";
import { Modal } from "@shared/ui/Modal";
import { Spinner } from "@shared/ui/Spinner";
import { toast } from "@shared/ui/store/useToastStore";

export function PerfilClient() {
    const router = useRouter();
    const { user, loading } = useReviewsUser();
    const [signInOpen, setSignInOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    async function handleSignOut() {
        await signOut();
        toast({ description: "Cerraste sesión", variant: "default" });
        router.push("/acerca");
    }

    async function handleDeleteAccount() {
        setDeleting(true);
        try {
            await deleteAccount();
            setConfirmOpen(false);
            toast({ description: "Tu cuenta fue eliminada", variant: "default" });
            router.push("/acerca");
        } catch (err) {
            toast({ title: "No pudimos eliminar tu cuenta", description: (err as Error).message, variant: "error" });
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="flex min-h-pwa-shell flex-col lg:pl-60">
            <PageShell>
                <Link
                    href="/acerca"
                    className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground no-underline transition hover:border-secondary hover:text-foreground"
                    title="Volver"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
                    </svg>
                </Link>

                <PageHeader title="Tu" highlight="cuenta" />

                <div className="mt-6">
                    {loading ? (
                        <div className="flex items-center gap-2 font-sans text-[13px] text-muted-foreground">
                            <Spinner className="h-4 w-4 border-2" />
                            Cargando…
                        </div>
                    ) : !user ? (
                        <div className="card flex items-center justify-between gap-3 p-4">
                            <p className="font-sans text-[13px] text-muted-foreground">
                                No iniciaste sesión.
                            </p>
                            <Button variant="primary" size="sm" onClick={() => setSignInOpen(true)}>
                                Iniciar sesión
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="card p-4">
                                <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Email
                                </p>
                                <p className="mt-1 font-sans text-sm text-foreground">{user.email}</p>
                            </div>

                            <Button variant="ghost" size="md" onClick={handleSignOut} className="w-full">
                                Cerrar sesión
                            </Button>

                            <Button
                                variant="danger"
                                size="md"
                                onClick={() => setConfirmOpen(true)}
                                className="w-full"
                            >
                                Eliminar cuenta
                            </Button>
                        </div>
                    )}
                </div>
            </PageShell>

            <Modal open={confirmOpen} onClose={() => (deleting ? undefined : setConfirmOpen(false))}>
                <div className="space-y-3">
                    <p className="font-sans text-sm font-semibold text-foreground">¿Eliminar tu cuenta?</p>
                    <p className="font-sans text-[13px] text-muted-foreground">
                        Vas a perder el acceso para editar o borrar tus reseñas. Las reseñas que ya
                        escribiste quedan visibles para el resto, pero anónimas — no van a poder
                        vincularse a vos de nuevo.
                    </p>
                    <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)} disabled={deleting}>
                            Cancelar
                        </Button>
                        <Button variant="danger" size="sm" onClick={handleDeleteAccount} disabled={deleting}>
                            {deleting ? "Eliminando…" : "Sí, eliminar mi cuenta"}
                        </Button>
                    </div>
                </div>
            </Modal>

            <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />

            <BottomNav />
        </div>
    );
}
