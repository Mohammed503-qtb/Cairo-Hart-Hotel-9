# Dar Al-Yasmin Royal Hotel — Production Dockerfile
# Multi-stage build using Bun for consistency with the dev toolchain.
# Produces a minimal production image (website + mobile app, seeded DB included).

# ---- Stage 1: base ----
FROM oven/bun:1-alpine AS base
WORKDIR /app

# ---- Stage 2: deps ----
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# ---- Stage 3: builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN bunx prisma generate

# Initialize database + seed (website + app)
# Set DATABASE_URL inline so prisma can read it during the RUN step
ENV DATABASE_URL="file:./db/custom.db"
RUN mkdir -p db && \
    bunx prisma db push --accept-data-loss && \
    (bunx tsx src/lib/seed.ts || true) && \
    (bunx tsx src/lib/seed-app.ts || true)

# Build Next.js (standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# ---- Stage 4: runner ----
# Use node:20-alpine for the runtime (smaller, and the standalone build is Node-compatible)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV DATABASE_URL="file:./db/custom.db"
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma files for runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/db ./db

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/hotel || exit 1

EXPOSE 3000

# Database is seeded during build. Mount a volume at /app/db for persistence.
CMD ["node", "server.js"]
