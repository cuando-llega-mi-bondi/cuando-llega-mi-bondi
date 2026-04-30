FROM node:22-slim

# Instalamos Git y dependencias mínimas para que node-gyp no falle con algunos paquetes
RUN apt-get update && apt-get install -y \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/home/node/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Habilitamos corepack para tener pnpm listo
RUN corepack enable && corepack prepare pnpm@latest --activate

# Directorio de trabajo
WORKDIR /workspaces
RUN chown -R node:node /workspaces

USER node

# Configuración de pnpm
RUN pnpm config set store-dir /home/node/.local/share/pnpm/store

CMD ["sleep", "infinity"]