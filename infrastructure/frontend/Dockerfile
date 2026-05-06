# syntax=docker/dockerfile:1.7
# Bondi MDP — Next.js standalone para self-hosting.

# ---- base ----
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Las NEXT_PUBLIC_* se hornean en el build (no se leen en runtime para el
# bundle del cliente). Pasalas como --build-arg desde docker-compose.
ARG NEXT_PUBLIC_BONDI_API_URL
ARG NEXT_PUBLIC_OSRM_URL
ARG NEXT_PUBLIC_VAPID_PUBLIC
ARG NEXT_PUBLIC_USE_STATIC_REFERENCE=true
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_BONDI_API_URL=$NEXT_PUBLIC_BONDI_API_URL \
    NEXT_PUBLIC_OSRM_URL=$NEXT_PUBLIC_OSRM_URL \
    NEXT_PUBLIC_VAPID_PUBLIC=$NEXT_PUBLIC_VAPID_PUBLIC \
    NEXT_PUBLIC_USE_STATIC_REFERENCE=$NEXT_PUBLIC_USE_STATIC_REFERENCE \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ---- runtime ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs

# Standalone server.js + sus deps mínimas.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# El dump (8 MB) lo copiamos explícito por las dudas. outputFileTracingIncludes
# en next.config.ts también lo trae al standalone, pero esto garantiza el path.
COPY --from=builder --chown=nextjs:nodejs /app/data ./data

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
