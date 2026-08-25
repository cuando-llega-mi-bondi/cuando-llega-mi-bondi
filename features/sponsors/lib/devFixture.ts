import type { AdBoardEntry } from "@features/sponsors/lib/purchases";

function daysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString();
}

/**
 * Avisos ficticios para probar el ranking/boost en local sin escribir nada en
 * la base real (no hay Supabase de dev separada). Sólo existen con
 * `next dev`; en el build de producción `NODE_ENV` es "production" y esto
 * queda en un array vacío. Se mezclan con lo real en `purchases.ts`, así que
 * se ven en el podio de /consultar, el ranking de /anunciate, el historial y
 * el boost — toda la UI, no un lugar suelto.
 */
export const DEV_FIXTURE_ADS: AdBoardEntry[] =
  process.env.NODE_ENV === "development"
    ? [
        {
          id: "dev-fixture-bondimdp",
          title: "Bondi MDP (aviso de prueba)",
          href: "https://bondimdp.com.ar",
          tagline: "Aviso ficticio para probar el link sin imagen (favicon)",
          amountArs: 3_200,
          since: daysAgo(1),
        },
        {
          id: "dev-fixture-instagram",
          title: "Café de Prueba",
          href: "https://instagram.com/bondimdp",
          tagline: "Aviso ficticio para probar el ícono de Instagram",
          amountArs: 2_600,
          since: daysAgo(2),
        },
        {
          id: "dev-fixture-youtube",
          title: "Kiosco Test",
          href: "https://youtube.com/@bondimdp",
          tagline: "Aviso ficticio para probar el ícono de YouTube",
          amountArs: 1_900,
          since: daysAgo(4),
        },
        {
          id: "dev-fixture-x",
          title: "Feria de Prueba",
          href: "https://x.com/bondimdp",
          tagline: "Aviso ficticio para probar el ícono de X",
          amountArs: 1_200,
          since: daysAgo(6),
        },
      ]
    : [];
