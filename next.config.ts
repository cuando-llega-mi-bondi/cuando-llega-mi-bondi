import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Output standalone para self-hosting con Docker. Genera `.next/standalone/`
   * con un server.js minimalista + solo los node_modules necesarios.
   */
  output: "standalone",

  /**
   * `lib/server/loadStaticDump.ts` lee `data/mgp-static-dump.json` con un path
   * computado en runtime (`path.join(process.cwd(), "data", ...)`). Como no
   * es un `import` estático, Next.js no lo detecta como dependencia. Esto le
   * dice al tracer que lo incluya en el bundle de `/api/reference`.
   */
  outputFileTracingIncludes: {
    "/api/reference": ["./data/mgp-static-dump.json"],
  },
};

export default nextConfig;
