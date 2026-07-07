import Link from "next/link";

export function Footer() {
    return (
        <footer className="space-y-1 pb-2 pt-4 text-center mb-20 lg:mb-6">
            <p className="text-[10.4px] uppercase tracking-wider text-muted-foreground opacity-80">
                © 2026 Bondi MDP · Mar del Plata
            </p>
            <p className="text-[12px] text-muted-foreground opacity-80">
                Hecha con ❤️ para marplatenses 🌊
            </p>
            <p className="text-[12px] text-muted-foreground opacity-80">
                <Link
                    href="/privacidad"
                    className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
                >
                    Política de privacidad
                </Link>
            </p>
        </footer>
    );
}
