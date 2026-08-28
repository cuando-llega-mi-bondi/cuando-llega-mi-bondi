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
        absolute: "Política de privacidad | Bondi MDP",
    },
    description:
        "Cómo Bondi MDP trata tus datos: publicidad de Google AdSense, analítica con Google Analytics y Microsoft Clarity, cookies y tus derechos según la Ley 25.326.",
    alternates: {
        canonical: "/privacidad",
    },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "https://bondimdp.com.ar/privacidad",
        title: "Política de privacidad | Bondi MDP",
        description:
            "Cómo Bondi MDP trata tus datos, qué servicios de terceros usamos (Google AdSense, Google Analytics, Microsoft Clarity) y cuáles son tus derechos.",
        siteName: "Bondi MDP",
        images: ["/opengraph-image"],
    },
    robots: {
        index: true,
        follow: true,
    },
};

// Última actualización de esta política.
const LAST_UPDATED = "6 de julio de 2026";

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
            name: "Política de privacidad",
            item: "https://bondimdp.com.ar/privacidad",
        },
    ],
};

// ── Sub-componentes ──────────────────────────────────────────────────────────

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

// ── Página ───────────────────────────────────────────────────────────────────

export default function PrivacidadPage() {
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
                    {/* ── ENCABEZADO ──────────────────────────────────── */}
                    <section className="space-y-3 text-center">
                        <BrandLogo className="text-3xl lg:text-4xl" />
                        <h1 className="text-[15px] font-semibold text-foreground">
                            Política de privacidad
                        </h1>
                        <p className="text-[12px] uppercase tracking-wider text-muted-foreground opacity-80">
                            Última actualización: {LAST_UPDATED}
                        </p>
                    </section>

                    {/* ── INTRO ───────────────────────────────────────── */}
                    <Section title="Resumen">
                        <p>
                            Bondi MDP es una app gratuita para consultar el transporte
                            público de Mar del Plata. No pedimos registro ni creamos cuentas
                            de usuario, y no vendemos tus datos personales. Para sostener el
                            proyecto y mejorarlo usamos publicidad y herramientas de
                            analítica de terceros, que se describen en detalle más abajo.
                        </p>
                    </Section>

                    {/* ── RESPONSABLE ─────────────────────────────────── */}
                    <Section title="Responsable">
                        <p>
                            Bondi MDP es un proyecto independiente y de código abierto,
                            mantenido por su equipo de desarrollo. Ante cualquier consulta
                            sobre esta política o sobre tus datos, podés escribirnos a través
                            de{" "}
                            <ExtLink href="https://github.com/cuando-llega-mi-bondi/cuando-llega-mi-bondi/issues">
                                los issues del repositorio en GitHub
                            </ExtLink>
                            .
                        </p>
                    </Section>

                    {/* ── QUÉ DATOS TRATAMOS ──────────────────────────── */}
                    <Section title="Qué información tratamos">
                        <Card>
                            <p className="text-[14px] font-semibold text-foreground">
                                Datos que vos nos das
                            </p>
                            <p>
                                No hay registro ni inicio de sesión. Si usás las funciones de
                                ubicación (por ejemplo, «paradas cerca» o «cómo llego»), tu
                                navegador nos pide permiso y usamos tu ubicación únicamente
                                para calcular paradas y recorridos cercanos. No guardamos un
                                historial de tus ubicaciones asociado a tu identidad.
                            </p>
                        </Card>
                        <Card>
                            <p className="text-[14px] font-semibold text-foreground">
                                Datos que se recopilan automáticamente
                            </p>
                            <p>
                                Como en la mayoría de los sitios web, al navegar se procesan
                                datos técnicos como tu dirección IP, tipo de dispositivo y
                                navegador, y las páginas que visitás. Estos datos se usan para
                                que la app funcione, para medir su uso y para mostrar
                                publicidad, a través de los servicios de terceros descritos
                                abajo.
                            </p>
                        </Card>
                        <Card>
                            <p className="text-[14px] font-semibold text-foreground">
                                Datos guardados en tu dispositivo
                            </p>
                            <p>
                                Tus favoritos y preferencias (por ejemplo, el tema claro u
                                oscuro) se guardan localmente en tu navegador. No se envían a
                                nuestros servidores.
                            </p>
                        </Card>
                    </Section>

                    {/* ── PUBLICIDAD ──────────────────────────────────── */}
                    <Section title="Publicidad">
                        <p>
                            Además de AdSense, se puede comprar un lugar publicitario
                            autoservicio en Consultar. Las condiciones, incluida la falta de
                            garantía de resultados, están en los{" "}
                            <a
                                href="/terminos"
                                className="underline decoration-border underline-offset-2 hover:text-foreground"
                            >
                                Términos del lugar
                            </a>
                            . Van rotulados como «Publicidad» y al tocarlos vas al sitio del
                            anunciante.
                        </p>
                        <p>
                            También mostramos anuncios a través de{" "}
                            <ExtLink href="https://policies.google.com/technologies/ads">
                                Google AdSense
                            </ExtLink>
                            . Google y sus socios usan cookies e identificadores para mostrar
                            anuncios basados en tus visitas a este y otros sitios.
                        </p>
                        <p>
                            Podés gestionar la personalización de anuncios de Google en{" "}
                            <ExtLink href="https://adssettings.google.com/">
                                Configuración de anuncios
                            </ExtLink>{" "}
                            y desactivar cookies de terceros para publicidad en{" "}
                            <ExtLink href="https://www.aboutads.info/choices/">
                                aboutads.info/choices
                            </ExtLink>
                            . Más información en la{" "}
                            <ExtLink href="https://policies.google.com/privacy">
                                Política de privacidad de Google
                            </ExtLink>
                            .
                        </p>
                    </Section>

                    {/* ── ANALÍTICA ───────────────────────────────────── */}
                    <Section title="Analítica y mejora de la app">
                        <Card>
                            <p className="text-[14px] font-semibold text-foreground">
                                Google Analytics
                            </p>
                            <p>
                                Usamos{" "}
                                <ExtLink href="https://policies.google.com/privacy">
                                    Google Analytics
                                </ExtLink>{" "}
                                para entender de forma agregada cómo se usa la app (páginas
                                más visitadas, dispositivos, etc.) y así mejorarla.
                            </p>
                        </Card>
                        <Card>
                            <p className="text-[14px] font-semibold text-foreground">
                                Microsoft Clarity
                            </p>
                            <p>
                                Usamos{" "}
                                <ExtLink href="https://learn.microsoft.com/clarity/faq">
                                    Microsoft Clarity
                                </ExtLink>{" "}
                                para capturar métricas de uso mediante cookies y mapas de
                                calor y grabaciones de sesión (patrones de clic, movimiento y
                                desplazamiento). Clarity ayuda a detectar problemas de uso.
                                Consultá la{" "}
                                <ExtLink href="https://privacy.microsoft.com/privacystatement">
                                    Declaración de privacidad de Microsoft
                                </ExtLink>
                                .
                            </p>
                        </Card>
                        <Card>
                            <p className="text-[14px] font-semibold text-foreground">
                                Vercel Analytics
                            </p>
                            <p>
                                Usamos{" "}
                                <ExtLink href="https://vercel.com/docs/analytics/privacy-policy">
                                    Vercel Analytics
                                </ExtLink>{" "}
                                para medir el rendimiento y el tráfico de la app de forma
                                anónima y agregada.
                            </p>
                        </Card>
                    </Section>

                    {/* ── COOKIES ─────────────────────────────────────── */}
                    <Section title="Cookies y tecnologías similares">
                        <p>
                            Usamos cookies y tecnologías similares (como el almacenamiento
                            local del navegador) para el funcionamiento de la app, para
                            recordar tus preferencias, para la analítica y para la
                            publicidad. Podés bloquear o eliminar las cookies desde la
                            configuración de tu navegador; ten en cuenta que algunas
                            funciones podrían dejar de funcionar correctamente.
                        </p>
                    </Section>

                    {/* ── DERECHOS ────────────────────────────────────── */}
                    <Section title="Tus derechos">
                        <p>
                            De acuerdo con la Ley N.º 25.326 de Protección de los Datos
                            Personales de Argentina, tenés derecho a acceder, rectificar,
                            actualizar y suprimir tus datos personales. Para ejercerlos,
                            contactanos por los medios indicados más arriba.
                        </p>
                        <p>
                            La Agencia de Acceso a la Información Pública (AAIP), órgano de
                            control de la Ley N.º 25.326, tiene la atribución de atender
                            denuncias y reclamos relativos al incumplimiento de las normas de
                            protección de datos personales.
                        </p>
                    </Section>

                    {/* ── CAMBIOS ─────────────────────────────────────── */}
                    <Section title="Cambios en esta política">
                        <p>
                            Podemos actualizar esta política para reflejar cambios en la app o
                            en los servicios que utilizamos. Publicaremos siempre la versión
                            vigente en esta página, con su fecha de última actualización.
                        </p>
                    </Section>

                    <Footer />
                </PageShell>

                <BottomNav />
            </div>
        </>
    );
}
