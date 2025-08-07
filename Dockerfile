# Multi-stage Docker build for PM-App
# Stage 1: Dependencies and build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for native modules
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

# Copy package files first (for better caching)
COPY package*.json ./
COPY prisma ./prisma/

# Configure npm for production-ready builds (no legacy peer deps)
RUN npm config set fund false
RUN npm config set audit false

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache \
    libc6-compat \
    cairo \
    jpeg \
    pango \
    giflib \
    librsvg \
    pixman \
    dumb-init \
    curl

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Configure npm for production
RUN npm config set fund false

# Install only production dependencies (without legacy peer deps)
RUN npm ci --only=production && \
    npm cache clean --force

# Generate Prisma client in production environment
RUN npx prisma generate

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/server.ts ./server.ts
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js
COPY --from=builder --chown=nextjs:nodejs /app/tailwind.config.ts ./tailwind.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/postcss.config.mjs ./postcss.config.mjs

# Create necessary directories with proper permissions
RUN mkdir -p logs uploads data && \
    chown -R nextjs:nodejs logs uploads data

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]
