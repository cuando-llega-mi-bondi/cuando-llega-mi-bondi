import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Output standalone para self-hosting con Docker. Genera `.next/standalone/`
   * con un server.js minimalista + solo los node_modules necesarios.
   */
  output: "standalone",

  /**
   * Habilita Cache Components (PPR + `'use cache'`). Requerido por
   * `lib/server/loadStaticDump.ts` que usa `'use cache' + cacheLife('max')`
   * + `cacheTag` en `getLineas()` y `getLineaData()`.
   */
  cacheComponents: true,

  /**
   * React Compiler: auto-memoiza componentes para reducir re-renders sin
   * tocar código. Especialmente útil acá donde HomeClient tiene 15+ piezas
   * de state y BusMap/RouteMap manejan muchos useMemo. Trade-off: builds
   * más lentos (Babel reintroducido).
   */
  reactCompiler: true,

  // `lib/server/loadStaticDump.ts` lee data/static/<files>.json con paths
  // computados en runtime (path.join(process.cwd(), "data", "static", ...)).
  // Como no son import estáticos, Next.js no los detecta como dependencia.
  // Esto le dice al tracer que los incluya en el bundle de /api/reference.
  outputFileTracingIncludes: {
    "/api/reference": ["./data/static/**/*.json"],
    "/recorrido/[linea]": ["./data/static/**/*.json"],
  },

  /**
   * Link headers para descubrimiento por agentes (RFC 8288). Apuntan a los
   * recursos machine-readable que ya servimos para LLMs/agentes. Van
   * comma-separated en un solo header `Link` porque dos entradas con la misma
   * key se pisan (la última gana).
   *   - describedby -> /llms.txt        (descripción del sitio para agentes)
   *   - service-doc -> /llms-full.txt   (documentación extendida)
   */
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Link",
            value: `</llms.txt>; rel="describedby"; type="text/plain", </llms-full.txt>; rel="service-doc"; type="text/plain"`,
          },
        ],
      },
    ];
  },

  /**
   * Compatibilidad: links viejos con ?tab=favoritos redirigen a /favoritos
   */
  async redirects() {
    return [
      {
        source: "/consultar",
        has: [{ type: "query", key: "tab", value: "favoritos" }],
        destination: "/favoritos",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
