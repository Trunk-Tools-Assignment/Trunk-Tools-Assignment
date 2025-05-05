# Build stage
# Use Node 22 Slim (Debian-based) for better compatibility with Prisma
FROM node:22-slim AS builder
WORKDIR /app

# Install OpenSSL 1.1 for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    wget \
    gnupg \
    && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb http://security.debian.org/debian-security bullseye-security main" > /etc/apt/sources.list.d/debian-bullseye.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends libssl1.1 \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files first to leverage Docker layer caching
# If package files don't change, this layer will be cached
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma client for database access
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

# Production stage
# Start with a clean Node 22 Slim image
FROM node:22-slim
WORKDIR /app

# Install OpenSSL 1.1 for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    wget \
    gnupg \
    && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb http://security.debian.org/debian-security bullseye-security main" > /etc/apt/sources.list.d/debian-bullseye.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends libssl1.1 \
    && rm -rf /var/lib/apt/lists/*

# Copy only necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create a non-root user for security
# This helps mitigate risks if the container is compromised
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/bash -m nodeuser

# Create logs directory and set permissions before switching to non-root user
RUN mkdir -p logs && \
    chown -R nodeuser:nodejs logs && \
    chmod 755 logs

# Switch to non-root user
USER nodeuser

# Expose the application port
EXPOSE 3000

# Set up a health check to monitor application status
# The health check uses the application's /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').request({hostname: 'localhost', port: process.env.PORT || 3000, path: '/health', timeout: 2000}, (res) => process.exit(res.statusCode === 200 ? 0 : 1)).end()"

# Start the application using the compiled JavaScript
CMD ["node", "dist/server.js"] 