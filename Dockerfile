# === PASO 1: Instalar dependencias (Usamos Bun por velocidad y compatibilidad con tu bun.lock) ===
FROM oven/bun:1.1-alpine AS deps
WORKDIR /app

COPY package*.json bun.lock* ./
RUN bun install

# === PASO 2: Compilar la aplicación (Usamos Node para evitar los límites de worker_threads de Bun) ===
FROM node:22-alpine AS builder
WORKDIR /app

# Nos traemos las node_modules de la etapa de Bun (ambos son Alpine, son totalmente compatibles)
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desactivar telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# ─── Variables necesarias en el Build ───
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
ARG NEXT_PUBLIC_CLARITY_PROJECT_ID
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ARG NEXT_PUBLIC_USE_STATIC_REFERENCE
ARG NEXT_PUBLIC_CUANDO_API_URL
ARG NEXT_PUBLIC_BONDI_API_URL
ARG NEXT_PUBLIC_VAPID_PUBLIC

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=$NEXT_PUBLIC_TELEGRAM_BOT_USERNAME \
    NEXT_PUBLIC_CLARITY_PROJECT_ID=$NEXT_PUBLIC_CLARITY_PROJECT_ID \
    NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID \
    NEXT_PUBLIC_USE_STATIC_REFERENCE=$NEXT_PUBLIC_USE_STATIC_REFERENCE \
    NEXT_PUBLIC_CUANDO_API_URL=$NEXT_PUBLIC_CUANDO_API_URL \
    NEXT_PUBLIC_BONDI_API_URL=$NEXT_PUBLIC_BONDI_API_URL \
    NEXT_PUBLIC_VAPID_PUBLIC=$NEXT_PUBLIC_VAPID_PUBLIC

# Compilar Next.js usando Node para que Turbopack corra nativo y sin errores
RUN npx next build

# === PASO 3: Imagen final de producción (Ultra liviana con Bun) ===
FROM oven/bun:1.1-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Copiar assets estáticos y el build standalone
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Ejecutamos el resultado final con Bun para mantener el rendimiento al máximo
CMD ["bun", "server.js"]