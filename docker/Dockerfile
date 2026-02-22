FROM node:22-alpine AS builder

RUN apk add --no-cache dumb-init
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/backend/package.json ./packages/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Copy source code
COPY packages/backend/ ./packages/backend/

# Build
WORKDIR /app/packages/backend
RUN pnpm build

# ============================================
# Production image
# ============================================
FROM node:22-alpine AS runner

RUN apk add --no-cache dumb-init git curl bash

# Install GitHub CLI
RUN apk add --no-cache github-cli 2>/dev/null || true

RUN addgroup -g 1001 nestjs && adduser -u 1001 -G nestjs -s /bin/sh -D nestjs

WORKDIR /app

# Copy built files
COPY --from=builder --chown=nestjs:nestjs /app/packages/backend/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/packages/backend/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/packages/backend/package.json ./

ENV NODE_ENV=production
ENV TZ=Asia/Ho_Chi_Minh

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
