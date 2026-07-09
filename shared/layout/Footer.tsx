import Link from "next/link";

export function Footer() {
    return (
        <footer className="mb-20 space-y-1 pb-2 pt-4 text-center lg:mb-4 lg:flex lg:items-center lg:justify-center lg:gap-3 lg:space-y-0">
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
