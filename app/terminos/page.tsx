import type { Metadata } from "next";
import Link from "next/link";
import { BottomNav } from "@shared/layout/BottomNav";
import { PageShell } from "@shared/layout/PageShell";
import { Footer } from "@shared/layout/Footer";
import { BrandLogo } from "@shared/ui/BrandLogo";
import { AD_PODIUM_SIZE } from "@features/sponsors/lib/board";
import { adSlotFloorArs, adSlotStepArs, formatArs } from "@features/sponsors/lib/pricing";

export const metadata: Metadata = {
    title: {
        absolute: "Términos del lugar | Bondi MDP",
    },
    description:
        "El lugar se compra y se pierde. No hay garantía de visitas, clics ni ventas. Escrito en criollo, a propósito.",
    alternates: {
        canonical: "/terminos",
    },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "https://bondimdp.com.ar/terminos",
        title: "Términos del lugar | Bondi MDP",
        description:
            "El lugar se compra y se pierde. No hay garantía de visitas, clics ni ventas. Escrito en criollo, a propósito.",
        siteName: "Bondi MDP",
        images: ["/opengraph-image"],
    },
};

const LAST_UPDATED = "24 de agosto de 2026";

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-3">
            <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
            <div className="space-y-3 text-[13px] leading-relaxed text-muted-foreground">
                {children}
            </div>
        </section>
    );
}

export default function TerminosPage() {
    return (
        <div className="flex min-h-pwa-shell flex-col lg:pl-60">
            <PageShell className="space-y-8 pt-4">
                <section className="space-y-3 text-center">
                    <BrandLogo className="text-3xl lg:text-4xl" />
                    <h1 className="text-[18px] font-semibold text-foreground">
                        Términos del lugar
                    </h1>
                    <p className="text-[12px] uppercase tracking-wider text-muted-foreground opacity-80">
                        Última actualización: {LAST_UPDATED}
                    </p>
                </section>


                <Section title="Qué es esto">
                    <p>
                        Bondi MDP es una app para ver cuándo llega el colectivo en Mar del
                        Plata. Los «lugares» son avisos rotulados como publicidad en
                        Consultar — abajo de elegir la línea, sobre todo en el celular.
                        Hay dos recuadros, uno arriba del otro, y no se compran por
                        separado: es un solo ranking. Se publican los dos avisos que más
                        pagaron, y el que más puso va arriba. No hay otro criterio: ni
                        calidad, ni antigüedad, ni nada. Es plata y listo.
                    </p>
                    <p>
                        Bondi MDP es un proyecto independiente, de código abierto. No es
                        oficial de la Municipalidad.
                    </p>
                </Section>

                <Section title="Esto no es una estrategia de venta">
                    <p>
                        Lo importante primero, para que no haya sorpresas: el lugar es un
                        experimento. No es una agencia, no es un medio y no está pensado
                        como campaña de marketing.
                    </p>
                    <p className="font-semibold text-foreground">
                        No lo tomes como una estrategia de publicidad ni de ventas. Si
                        estás decidiendo dónde poner plata para vender más, esto no es el
                        lugar. Comprá acá solo si te da igual perder esa plata.
                    </p>
                    <p>
                        Bondi MDP no se hace cargo de ningún resultado. Ni de visitas, ni
                        de clics, ni de ventas, ni de seguidores, ni de que la app se haga
                        más conocida, ni de lo que pase después con lo que publicaste.
                        Comprás que tu link se muestre mientras sigas entre los dos que
                        más pagaron, y nada más que eso.
                    </p>
                    <p>
                        Puede entrar mucha gente a Consultar o puede no entrar nadie a
                        tocarte. Si eso te molestaría, no compres — está perfecto.
                    </p>
                </Section>

                <Section title="Cómo funciona">
                    <ul className="list-disc space-y-2 pl-5">
                        <li>Hay {AD_PODIUM_SIZE} lugares y un solo ranking: se publican los {AD_PODIUM_SIZE} que más pagaron.</li>
                        <li>Mientras sobre un lugar, publicar sale {formatArs(adSlotFloorArs())}.</li>
                        <li>Con los {AD_PODIUM_SIZE} lugares ocupados tenés que poner al menos {formatArs(adSlotStepArs())} más que el último para entrar, y {formatArs(adSlotStepArs())} más que el primero para quedar arriba.</li>
                        <li>Cuánto pagó cada aviso es público: queda en el historial de Anunciate, con el nombre y el link que pusiste.</li>
                        <li>Tu aviso depende solo de cuánto pusiste. Te pueden sacar un segundo después de pagar y no hay devolución por eso: es el juego.</li>
                        <li>No hay tiempo mínimo ni lugar asegurado.</li>
                    </ul>
                </Section>

                <Section title="Qué NO te prometemos">
                    <p>
                        No te prometemos visitas, clics, ventas, seguidores ni resultados
                        de ningún tipo. Cuánta gente vea tu aviso depende de cuánta gente
                        use Consultar, y eso no lo controlamos.
                    </p>
                    <p>
                        Comprar el lugar es comprar que se publique un link en un recuadro,
                        nada más. Si esperabas otra cosa, no compres.
                    </p>
                </Section>

                <Section title="De lo que publicás te hacés cargo vos">
                    <p>
                        El título, el texto y el link son tuyos y son tu responsabilidad.
                        Vos garantizás que tenés derecho a publicar eso y que no le estás
                        mintiendo a nadie.
                    </p>
                    <p>
                        Bondi MDP no revisa, no aprueba ni recomienda nada de lo que
                        aparece. Que algo esté publicado significa que alguien pagó, y nada
                        más que eso.
                    </p>
                    <p>
                        Si alguien tiene un problema con lo que publicaste, es entre esa
                        persona y vos.
                    </p>
                </Section>

                <Section title="Lo que no se puede publicar">
                    <ul className="list-disc space-y-2 pl-5">
                        <li>Nada ilegal en Argentina.</li>
                        <li>Estafas, engaños, ofertas que no existen o promesas de rendimientos.</li>
                        <li>Contenido sexual, violento o que apunte a menores.</li>
                        <li>Discriminación, amenazas o acoso.</li>
                        <li>Virus, phishing, links que no van a donde dicen ir.</li>
                        <li>Hacerte pasar por otra persona, marca u organización.</li>
                    </ul>
                    <p>
                        Si publicás algo de esto lo bajamos sin avisar. También lo podemos
                        bajar si nos parece que nos mete en un problema, aunque no esté en
                        esta lista. Si lo bajamos por algo de esta lista, no hay devolución.
                    </p>
                </Section>

                <Section title="La plata">
                    <p>
                        Se cobra por Mercado Pago. El precio es el que ponés vos: no hay
                        costo mensual ni renovación. Los recargos del medio de pago, si los
                        hay, los define Mercado Pago.
                    </p>
                </Section>

                <Section title="Devoluciones">
                    <p>
                        Se devuelve la plata en dos casos: si pagaste y tu aviso nunca se
                        mostró por una falla nuestra, o si alguien puso más mientras
                        estabas pagando y el lugar ya no era tuyo. Ahí te devolvemos el
                        total. Escribinos y listo.
                    </p>
                    <p>
                        Fuera de eso no hay devoluciones. Que te saquen del lugar no es
                        motivo de devolución: eso es exactamente el juego, y lo sabías
                        antes de comprar. Que tu aviso no te haya traído visitas ni ventas
                        tampoco: nunca te lo prometimos.
                    </p>
                    <p>
                        Los derechos que te da la ley de defensa del consumidor siguen
                        siendo tuyos y nada de este texto te los saca — si te corresponde
                        algo por ley, te lo damos.
                    </p>
                </Section>

                <Section title="Tus datos">
                    <p>
                        Guardamos lo mínimo: lo que escribiste en el aviso —que ya es
                        público, junto con cuánto pagaste y cuándo—, que aceptaste estos términos, y
                        el identificador que nos devuelve Mercado Pago para reconocer tu
                        pago.
                    </p>
                    <p>
                        No te pedimos ni guardamos datos de tu tarjeta: eso lo maneja
                        Mercado Pago. Cómo tratamos el resto de datos de la app está en la{" "}
                        <Link href="/privacidad" className="underline underline-offset-2 hover:text-foreground">
                            política de privacidad
                        </Link>
                        .
                    </p>
                </Section>

                <Section title="Los límites">
                    <ul className="list-disc space-y-2 pl-5">
                        <li>Título: hasta 80 caracteres.</li>
                        <li>Texto: hasta 140 caracteres.</li>
                        <li>Un link, que tiene que ser http o https (Instagram, X, YouTube o un sitio).</li>
                    </ul>
                </Section>

                <Section title="Si esto cierra">
                    <p>
                        Bondi MDP puede dejar de mostrar el lugar en cualquier momento. Si
                        eso pasa, la plata que pusiste no se devuelve: no hay un plazo
                        mínimo de exhibición. Los precios y las reglas también pueden
                        cambiar.
                    </p>
                </Section>

                <Section title="Si algo sale mal">
                    <p>
                        El lugar se ofrece tal como está, sin garantías de funcionamiento
                        continuo ni de resultados.
                    </p>
                    <p>
                        En la medida en que la ley lo permita, Bondi MDP y quienes lo
                        mantienen no responden por daños indirectos, lucro cesante, pérdida
                        de oportunidades, de ventas ni de reputación. La responsabilidad
                        total por un reclamo relacionado con tu compra no puede superar lo
                        que pagaste por ese lugar.
                    </p>
                    <p>
                        Tampoco respondemos por lo que publique otra persona ni por lo que
                        pase en los sitios a los que lleva el aviso.
                    </p>
                    <p>
                        Rige la ley argentina y los tribunales ordinarios de Mar del Plata,
                        provincia de Buenos Aires, salvo normas de orden público que
                        impongan otro fuero.
                    </p>
                </Section>

                <Section title="Cómo contactarnos">
                    <p>
                        Si tenés un problema con tu compra o querés reportar un aviso:{" "}
                        <Link
                            href="https://github.com/cuando-llega-mi-bondi/cuando-llega-mi-bondi/issues"
                            className="underline underline-offset-2 hover:text-foreground"
                        >
                            issues en GitHub
                        </Link>
                        .
                    </p>
                </Section>

                <Footer />
            </PageShell>
            <BottomNav />
        </div>
    );
}
