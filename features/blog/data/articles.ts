import { BondiVsCuandoLlegaArticle } from "@features/blog/components/BondiVsCuandoLlegaArticle";
import { ComoSaberCuandoLlegaArticle } from "@features/blog/components/ComoSaberCuandoLlegaArticle";
import type { BlogArticle } from "@features/blog/types";

export const ARTICLES: BlogArticle[] = [
    {
        slug: "bondi-mdp-vs-cuando-llega",
        title: "Bondi MDP vs. Cuándo Llega: comparativa de apps de colectivos en Mar del Plata",
        description:
            "Bondi MDP vs. la app oficial \"Cuándo Llega\": mismos datos en tiempo real, distinta instalación, registro, cobertura de líneas y código abierto.",
        datePublished: "2026-08-27T09:00:00-03:00",
        dateModified: "2026-08-27T09:00:00-03:00",
        section: "Comparativas",
        tags: ["Mar del Plata", "Transporte público", "App colectivos"],
        Body: BondiVsCuandoLlegaArticle,
    },
    {
        slug: "como-saber-cuando-llega-el-colectivo-en-mar-del-plata",
        title: "Cómo saber cuándo llega el colectivo en Mar del Plata",
        description:
            "Guía con todas las formas de consultar el arribo de colectivos en tiempo real en Mar del Plata: app oficial, Bondi MDP, recorridos, paradas cercanas y más.",
        datePublished: "2026-08-27T09:00:00-03:00",
        dateModified: "2026-08-27T09:00:00-03:00",
        section: "Guías",
        tags: ["Mar del Plata", "Transporte público", "Guía"],
        Body: ComoSaberCuandoLlegaArticle,
    },
];

export function getArticle(slug: string): BlogArticle | undefined {
    return ARTICLES.find((a) => a.slug === slug);
}

/**
 * Informes de estadísticas: viven en su propia ruta (no en /blog/[slug]),
 * pero aparecen listados en /blog como una entrada más.
 */
export const REPORTS = [
    {
        slug: "primer-trimestre-en-numeros",
        title: "Bondi MDP: el primer trimestre en números — 22.893 usuarios activos",
        description:
            "22.893 usuarios activos, 763.000 vistas y una curva de uso que se acelera trimestre a trimestre. Sin campañas pagas. Solo la app y el boca a boca marplatense.",
        datePublished: "2026-08-27T09:00:00-03:00",
        dateModified: "2026-08-27T09:00:00-03:00",
        section: "Estadísticas",
        href: "/primer-trimestre-en-numeros",
    },
    {
        slug: "un-mes-en-numeros",
        title: "Bondi MDP: estadísticas del primer mes — 19.267 usuarios en Mar del Plata",
        description:
            "19.267 usuarios activos, 300.000 vistas y ratio de fidelidad 2:1 en 30 días. Sin campañas pagas. Solo la app y el boca a boca marplatense.",
        datePublished: "2026-05-28T09:00:00-03:00",
        dateModified: "2026-05-28T09:00:00-03:00",
        section: "Estadísticas",
        href: "/un-mes-en-numeros",
    },
];
