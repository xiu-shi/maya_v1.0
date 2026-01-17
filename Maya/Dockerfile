# Maya Backend Dockerfile
# For deployment on AI Builder Space / Koyeb platform
# Build context: repository root

FROM node:18-alpine

# Install wget for health checks
RUN apk add --no-cache wget curl

# Set working directory
WORKDIR /app

# Copy entire Maya directory structure
COPY Maya/ ./Maya/

# Set working directory to backend
WORKDIR /app/Maya/backend

# Install dependencies (production only)
# Use npm install instead of npm ci for more flexibility
RUN npm install --only=production --ignore-scripts

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
