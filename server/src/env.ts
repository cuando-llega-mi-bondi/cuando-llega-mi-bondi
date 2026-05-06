/**
 * Validación estricta de variables de entorno con zod. Si algo crítico falta,
 * el server no arranca. Sin fallbacks inseguros.
 */
import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";

const schema = z.object({
    DATABASE_URL: z.string().url("DATABASE_URL debe ser una URL postgres válida"),

    JWT_SECRET: z
        .string()
        .min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
    AUTH_COOKIE_NAME: z.string().default("auth_token"),
    AUTH_COOKIE_DOMAIN: z.string().optional(),
    AUTH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(604800),

    ALLOWED_ORIGINS: z
        .string()
        .min(1, "ALLOWED_ORIGINS no puede estar vacío")
        .transform((s) =>
            s
                .split(",")
                .map((o) => o.trim())
                .filter(Boolean),
        ),

    VAPID_PUBLIC: z.string().min(1),
    VAPID_PRIVATE: z.string().min(1),
    VAPID_SUBJECT: z
        .string()
        .regex(/^(mailto:|https?:\/\/)/, "VAPID_SUBJECT debe ser mailto: o https://"),

    MGP_PROXY_URL: z.string().url().optional(),

    PORT: z.coerce.number().int().positive().default(4000),
    HOST: z.string().default("0.0.0.0"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌ Variables de entorno inválidas:");
    for (const issue of parsed.error.issues) {
        console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
}

// En prod, AUTH_COOKIE_DOMAIN es requerido si el frontend está en otro origin.
if (isProd && !parsed.data.AUTH_COOKIE_DOMAIN) {
    console.warn(
        "⚠ AUTH_COOKIE_DOMAIN no seteado en producción — la cookie va a quedar limitada al host del API.",
    );
}

export const env = parsed.data;
