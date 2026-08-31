# Cairo Hart Hotel — Production Dockerfile
# Multi-stage build for minimal production image (website + mobile app)

FROM node:20-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json bun.lock* ./
RUN npm ci --ignore-scripts

# Stage 2: Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Initialize database + seed
RUN mkdir -p db && \
    npx prisma db push --accept-data-loss && \
    (npx tsx src/lib/seed.ts || true) && \
    (npx tsx src/lib/seed-app.ts || true)

# Build Next.js
ENV DATABASE_URL="file:./db/custom.db"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Production runtime
FROM base AS runner
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

# Copy package.json + prisma CLI for runtime migrations
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy seed scripts for first-run initialization
COPY --from=builder /app/src/lib/seed.ts ./seed.ts
COPY --from=builder /app/src/lib/seed-app.ts ./seed-app.ts
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/typescript ./node_modules/typescript

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/hotel || exit 1

# Note: database is seeded during build. For persistent data across restarts,
# mount a volume at /app/db.
CMD ["node", "server.js"]
