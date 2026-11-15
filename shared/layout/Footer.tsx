import Link from "next/link";

export function Footer() {
    return (
        <footer className="mb-20 space-y-1 pb-2 pt-4 text-center lg:mb-4 lg:flex lg:items-center lg:justify-center lg:gap-3 lg:space-y-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                © 2026 Bondi MDP · Mar del Plata
            </p>
            <p className="text-xs text-muted-foreground">
                Hecha con ❤️ para marplatenses 🌊
            </p>
            <p className="text-xs text-muted-foreground">
                <Link
                    href="/privacidad"
                    className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
                >
                    Privacidad
                </Link>
                {" · "}
                <Link
                    href="/terminos"
                    className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
                >
                    Términos del lugar
                </Link>
                {" · "}
                <Link
                    href="/blog"
                    className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
                >
                    Blog
                </Link>
                {" · "}
                <Link
                    href="/android"
                    className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
                >
                    Google Play
                </Link>
            </p>
        </footer>
    );
}
