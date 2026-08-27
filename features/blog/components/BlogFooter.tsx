import Link from "next/link";

/** Footer compartida por el índice del blog y cada artículo — misma estética que /un-mes-en-numeros. */
export function BlogFooter() {
    return (
        <footer className="bg-muted px-6 py-10">
            <div className="mx-auto flex max-w-[880px] flex-col items-center justify-between gap-6 md:flex-row">
                <Link href="/" className="select-none text-lg font-bold italic tracking-tight">
                    <span className="text-foreground">BONDI</span>
                    <span className="text-primary">MDP</span>
                </Link>
                <p className="text-xs text-muted-foreground">App gratuita de colectivos para Mar del Plata.</p>
                <Link
                    href="/privacidad"
                    className="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                >
                    Privacidad
                </Link>
            </div>
        </footer>
    );
}
