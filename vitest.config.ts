import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Mismos alias que tsconfig.json (paths): los tests importan igual que el código.
export default defineConfig({
    resolve: {
        alias: [
            {
                find: /^@features\//,
                replacement: fileURLToPath(new URL("./features/", import.meta.url)),
            },
            {
                find: /^@shared\//,
                replacement: fileURLToPath(new URL("./shared/", import.meta.url)),
            },
            {
                find: /^@\//,
                replacement: fileURLToPath(new URL("./", import.meta.url)),
            },
        ],
    },
    test: {
        include: ["{app,features,shared,lib,scripts}/**/*.test.{ts,tsx}"],
    },
});
