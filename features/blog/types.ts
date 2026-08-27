import type { ComponentType } from "react";

export interface BlogArticle {
    slug: string;
    title: string;
    /** Meta description / dek, ~150-160 caracteres. */
    description: string;
    /** ISO con offset -03:00. */
    datePublished: string;
    dateModified: string;
    /** Sección editorial, usada en OG "section" y en el dateline. */
    section: string;
    tags: string[];
    Body: ComponentType;
}
