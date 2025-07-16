# Multi-stage Docker build for Next.js CarConfigurator application
# Stage 1: Dependencies
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code (excluding tests via .dockerignore)
COPY . .

# Install all dependencies including dev dependencies for build
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Disable telemetry
RUN npx next telemetry disable

# Build the application (with optimized settings for Docker)
ENV NODE_ENV=production
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Install dumb-init for proper signal handling and sqlite3 for database checks
RUN apk add --no-cache dumb-init sqlite

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma client and related files
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy Prisma files and package.json for seeding
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Install ALL dependencies including dev dependencies for seeding (as root)
RUN npm install

# Copy startup script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create directories and set permissions
RUN mkdir -p /app/data
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Start the application with dumb-init
ENTRYPOINT ["dumb-init", "--", "docker-entrypoint.sh"]
CMD ["node", "server.js"]
