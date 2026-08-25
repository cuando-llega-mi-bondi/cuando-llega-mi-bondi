import type { Metadata } from "next";
import { BottomNav } from "@shared/layout/BottomNav";
import { PageShell } from "@shared/layout/PageShell";
import { Footer } from "@shared/layout/Footer";
import { BrandLogo } from "@shared/ui/BrandLogo";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
    title: {
        absolute: "Contacto | Bondi MDP",
    },
    description:
        "Cómo contactar al equipo de Bondi MDP: reportar un error en los horarios, consultar por publicidad o ejercer tus derechos sobre datos personales.",
    alternates: {
        canonical: "/contacto",
    },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "https://bondimdp.com.ar/contacto",
        title: "Contacto | Bondi MDP",
        description:
            "Cómo contactar al equipo de Bondi MDP: reportar un error, consultar por publicidad o ejercer tus derechos sobre datos personales.",
        siteName: "Bondi MDP",
    },
    robots: {
        index: true,
        follow: true,
    },
};

const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
        {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: "https://bondimdp.com.ar",
        },
        {
            "@type": "ListItem",
            position: 2,
            name: "Contacto",
            item: "https://bondimdp.com.ar/contacto",
        },
    ],
};

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-3">
            <h2 className="text-[10.4px] font-normal uppercase tracking-wider text-muted-foreground">
                {title}
            </h2>
            <div className="space-y-3 text-[13px] leading-relaxed text-muted-foreground">
                {children}
            </div>
        </section>
    );
}

function Card({ children }: { children: React.ReactNode }) {
    return (
        <div className="space-y-2 rounded-xl border border-border bg-card p-4">
            {children}
        </div>
    );
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
        >
            {children}
        </a>
    );
}

export default function ContactoPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(breadcrumbJsonLd),
                }}
            />
            <div className="flex min-h-pwa-shell flex-col lg:pl-60">
                <PageShell className="space-y-10 pt-4">
                    <section className="space-y-3 text-center">
                        <BrandLogo className="text-3xl lg:text-4xl" />
                        <h1 className="text-[15px] font-semibold text-foreground">
                            Contacto
                        </h1>
                        <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                            Bondi MDP es un proyecto independiente y de código abierto
                            hecho en Mar del Plata, Argentina. No es una app oficial de
                            la Municipalidad de General Pueyrredón, sino una alternativa
                            comunitaria que consume los mismos datos municipales.
                        </p>
                    </section>

                    <Section title="Reportar un problema o error en los horarios">
                        <Card>
                            <p>
                                Si un horario, recorrido o parada se ve mal, o encontraste
                                un bug en la app, avisanos abriendo un{" "}
                                <ExtLink href="https://github.com/cuando-llega-mi-bondi/cuando-llega-mi-bondi/issues">
                                    issue en GitHub
                                </ExtLink>
                                . Es el canal más rápido: lo lee directamente el equipo
                                que mantiene el código.
                            </p>
                        </Card>
                    </Section>

                    <Section title="Consultas por publicidad">
                        <Card>
                            <p>
                                Para anunciar en Consultar (los lugares publicitarios
                                autoservicio), la compra y el historial de precios están
                                en{" "}
                                <a
                                    href="/anunciate"
                                    className="underline decoration-border underline-offset-2 hover:text-foreground"
                                >
                                    /anunciate
                                </a>
                                . Las condiciones están en los{" "}
                                <a
                                    href="/terminos"
                                    className="underline decoration-border underline-offset-2 hover:text-foreground"
                                >
                                    Términos del lugar
                                </a>
                                .
                            </p>
                        </Card>
                    </Section>

                    <Section title="Datos personales y privacidad">
                        <Card>
                            <p>
                                Para ejercer tus derechos de acceso, rectificación o
                                supresión de datos personales según la Ley N.º 25.326, o
                                por cualquier otra consulta que no encaje en las
                                categorías de arriba, escribinos a{" "}
                                <ExtLink href="mailto:maticelizramos@gmail.com">
                                    maticelizramos@gmail.com
                                </ExtLink>
                                . Más detalle sobre qué datos tratamos en la{" "}
                                <a
                                    href="/privacidad"
                                    className="underline decoration-border underline-offset-2 hover:text-foreground"
                                >
                                    política de privacidad
                                </a>
                                .
                            </p>
                        </Card>
                    </Section>

                    <Section title="Quiénes somos">
                        <p>
                            Bondi MDP lo desarrollan y mantienen{" "}
                            <ExtLink href="https://dotfn.dev">Nicolás Jiménez</ExtLink> y{" "}
                            <ExtLink href="https://celizin.dev">
                                Matias Celiz Ramos
                            </ExtLink>
                            . El código es público en{" "}
                            <ExtLink href="https://github.com/cuando-llega-mi-bondi/cuando-llega-mi-bondi">
                                GitHub
                            </ExtLink>
                            . Más sobre el proyecto y el equipo en{" "}
                            <a
                                href="/acerca"
                                className="underline decoration-border underline-offset-2 hover:text-foreground"
                            >
                                /acerca
                            </a>
                            .
                        </p>
                    </Section>

                    <Footer />
                </PageShell>

                <BottomNav />
            </div>
        </>
    );
}
