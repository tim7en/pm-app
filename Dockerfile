# Multi-stage Docker build for PM-App Production
# Stage 1: Dependencies and build
FROM node:20-alpine AS builder

# Install security updates
RUN apk upgrade --no-cache

# Set working directory
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev

# Copy package files first (leverage Docker layer caching)
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.mjs ./
COPY vitest.config.ts ./
COPY prisma ./prisma/

# Configure npm for production builds
RUN npm config set fund false && \
    npm config set audit false && \
    npm config set progress false

# Install dependencies (compatible with older npm versions)
RUN npm install --production=false

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY src ./src
COPY public ./public
COPY server.ts ./
COPY components.json ./

# Build the application with optimizations
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Production runtime (using slim image for security)
FROM node:20-alpine AS runner

# Install security updates first
RUN apk upgrade --no-cache && \
    apk add --no-cache \
    libc6-compat \
    cairo \
    jpeg \
    pango \
    giflib \
    librsvg \
    pixman \
    dumb-init \
    curl \
    tini

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs --ingroup nodejs

# Set working directory
WORKDIR /app

# Create necessary directories with proper permissions
RUN mkdir -p data logs uploads .next/cache && \
    chown -R nextjs:nodejs /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm config set fund false && \
    npm config set audit false && \
    npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Copy Prisma schema and generate client for production
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built application from builder stage with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/server.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

# Switch to non-root user
USER nextjs

# Set production environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["tini", "--"]

# Start the application
CMD ["node", "server.js"]
