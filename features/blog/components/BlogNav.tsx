import Link from "next/link";

/** Nav sticky compartida por el índice del blog y cada artículo — misma estética que /un-mes-en-numeros. */
export function BlogNav() {
    return (
        <nav className="sticky top-0 z-[100] border-b border-border bg-background/88 px-6 backdrop-blur-md">
            <div className="mx-auto flex h-[58px] max-w-[880px] items-center justify-between">
                <Link href="/" className="select-none text-lg font-bold italic tracking-tight">
                    <span className="text-foreground">BONDI</span>
                    <span className="text-primary">MDP</span>
                </Link>
                <div className="flex items-center gap-6">
                    <Link
                        href="/blog"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Blog
                    </Link>
                    <Link
                        href="/"
                        className="rounded-md bg-success px-4 py-1.5 text-xs font-semibold text-foreground transition-opacity hover:opacity-85"
                    >
                        Abrir app →
                    </Link>
                </div>
            </div>
        </nav>
    );
}
