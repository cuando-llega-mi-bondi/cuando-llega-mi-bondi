# Imagen para el bondi-server (API + scheduler).
# tsx ejecuta TS en runtime — no necesitamos build step.

FROM node:22-alpine

# pnpm pineado a 9.x: el lockfile es v9.0 y pnpm@10 bloquea build scripts por
# política (ERR_PNPM_IGNORED_BUILDS con esbuild, dep de tsx). 9.x los corre ok.
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Deps cacheables
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod=false

# Código
COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production

# La API expone 4000 dentro de la network docker.
EXPOSE 4000

USER node

# Default = API. Invocamos tsx directo (no `pnpm start`) para no depender de
# corepack en runtime: como USER node no tiene la pnpm del build, corepack
# bajaría pnpm@latest y su deps-status-check lanzaría un `pnpm install` que
# falla con EACCES sobre /app (owner root). El scheduler override en compose.
CMD ["node_modules/.bin/tsx", "src/index.ts"]
