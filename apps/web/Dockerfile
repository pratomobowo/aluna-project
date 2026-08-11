# ---- Builder stage ----
FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable

# Copy workspace manifests
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install deps (workspace-aware)
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/web apps/web
COPY packages/shared packages/shared

# Build web (vite build → dist/)
RUN pnpm --filter @aluna/web build

# ---- Runner stage (nginx) ----
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Copy built static files
COPY --from=builder /app/apps/web/dist .

# SPA fallback: serve index.html for unknown routes
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
