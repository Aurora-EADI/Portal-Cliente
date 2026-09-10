# =========================
# Build
# =========================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

RUN npm install --global pnpm@11.3.0

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY frontend/package.json ./frontend/package.json
COPY portal-cliente-api/package.json ./portal-cliente-api/package.json

RUN pnpm --filter portal-cliente-api --filter portal-cliente install --frozen-lockfile

COPY portal-cliente-api ./portal-cliente-api

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm build:api
RUN pnpm --filter portal-cliente-api deploy --legacy --prod /prod/api
# Generate inside the portable dependency tree rather than the build workspace.
RUN cd /prod/api && \
    node /app/portal-cliente-api/node_modules/prisma/build/index.js generate --schema=prisma/schema.prisma && \
    node -e "require('@prisma/client'); require('bcrypt')"


# =========================
# Production
# =========================
FROM node:22-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3030

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /prod/api ./

USER node

EXPOSE 3030

CMD ["node", "dist/main"]
