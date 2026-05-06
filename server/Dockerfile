# Imagen para el bondi-server (API + scheduler).
# tsx ejecuta TS en runtime — no necesitamos build step.

FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

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

# Default = API. El compose corre el scheduler como un service aparte
# que sobreescribe el CMD a "pnpm scheduler".
CMD ["pnpm", "start"]
