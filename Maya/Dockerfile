# Maya Backend Dockerfile
# For deployment on AI Builder Space / Koyeb platform
# Build context should be repository root

FROM node:18-alpine

# Create app directory structure
WORKDIR /app

# Copy package files first (for better Docker layer caching)
COPY Maya/backend/package*.json ./Maya/backend/

# Install dependencies
WORKDIR /app/Maya/backend
RUN npm install --production

# Copy backend application files
COPY Maya/backend/ ./

# Copy knowledge base (needed at runtime)
COPY Maya/knowledge/ ../knowledge/

# Copy frontend (needed for static file serving)
COPY Maya/frontend/ ../frontend/

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check (optional but recommended)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server.js"]
