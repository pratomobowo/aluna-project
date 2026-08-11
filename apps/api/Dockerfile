# ---- Builder stage ----
FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable

# Copy workspace manifests
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install deps (workspace-aware)
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/api apps/api
COPY packages/shared packages/shared

# Build API (tsup bundles EVERYTHING with --no-external)
RUN pnpm --filter @aluna/api build

# ---- Runner stage ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy fully-bundled output (self-contained, no node_modules needed)
COPY --from=builder /app/apps/api/dist ./dist

EXPOSE 3001

CMD ["node", "dist/index.cjs"]
