# === PASO 1: Instalar dependencias ===
FROM oven/bun:1.1-alpine AS deps
WORKDIR /app

# Copiar archivos de configuración de paquetes
COPY package*.json bun.lockb* ./
# Instala dependencias congelando las versiones
RUN bun install --frozen-lockfile

# === PASO 2: Compilar la aplicación ===
FROM oven/bun:1.1-alpine AS builder
WORKDIR /app

# Nos traemos las node_modules instaladas del paso anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desactivar telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# ─── ÚNICAS variables necesarias en el Build (Inyectadas en el cliente) ───
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

# Compilar Next.js (requiere output: 'standalone' en next.config.js)
RUN bun run build

# === PASO 3: Imagen final de producción (Ultra liviana) ===
FROM oven/bun:1.1-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Copiar únicamente los assets estáticos y el servidor standalone optimizado
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Ejecutar el servidor standalone directamente con Bun
CMD ["bun", "server.js"]