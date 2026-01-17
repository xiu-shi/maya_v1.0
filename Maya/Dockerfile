# Maya Backend Dockerfile
# For deployment on AI Builder Space / Koyeb platform
# Build context: repository root

FROM node:18-alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Create directory structure
RUN mkdir -p /app/Maya/backend /app/Maya/knowledge /app/Maya/frontend

# Set working directory
WORKDIR /app/Maya/backend

# Copy package files first (for better Docker layer caching)
COPY Maya/backend/package.json Maya/backend/package-lock.json ./

# Install dependencies (production only)
RUN npm ci --only=production --ignore-scripts || npm install --only=production --ignore-scripts

# Copy backend source files (exclude node_modules, logs, etc via .dockerignore)
COPY Maya/backend/ ./

# Copy knowledge base
COPY Maya/knowledge/ /app/Maya/knowledge/

# Copy frontend
COPY Maya/frontend/ /app/Maya/frontend/

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check - wait longer for startup
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD wget --quiet --tries=1 --spider --timeout=5 http://localhost:3000/health || exit 1

# Start server
CMD ["node", "server.js"]
