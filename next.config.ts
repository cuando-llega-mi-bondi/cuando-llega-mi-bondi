import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    /**
     * `lib/server/loadStaticDump.ts` lee `data/mgp-static-dump.json` con un path
     * computado en runtime (`path.join(process.cwd(), "data", ...)`). Como no es
     * un `import` estático, Next.js no lo detecta como dependencia y Vercel
     * deploya la función `/api/reference` sin el JSON al lado → ENOENT en
     * `stat()` → `getCachedStaticDump()` devuelve null → cliente cae al proxy
     * MGP. Este `outputFileTracingIncludes` fuerza a incluir el dump.
     */
    outputFileTracingIncludes: {
      "/api/reference": ["./data/mgp-static-dump.json"],
    },
  };

export default nextConfig;
