# Maya Backend Dockerfile
# For deployment on AI Builder Space / Koyeb platform
# Build context: repository root

FROM node:18-alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Set working directory to backend
WORKDIR /app/Maya/backend

# Copy package files first (for better Docker layer caching)
COPY Maya/backend/package*.json ./

# Install dependencies (production only, ignore scripts to avoid build issues)
RUN npm ci --only=production --ignore-scripts

# Copy backend application files
COPY Maya/backend/ ./

# Copy knowledge base (needed at runtime) - maintain relative structure
COPY Maya/knowledge/ /app/Maya/knowledge/

# Copy frontend (needed for static file serving) - maintain relative structure  
COPY Maya/frontend/ /app/Maya/frontend/

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check - simple check on /health endpoint
# Wait longer for startup (server needs time to initialize, especially for KB loading)
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD wget --quiet --tries=1 --spider --timeout=5 http://localhost:3000/health || exit 1

# Start server
CMD ["node", "server.js"]
