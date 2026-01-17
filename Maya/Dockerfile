# Maya Backend Dockerfile
# For deployment on AI Builder Space / Koyeb platform
# Build context: repository root

FROM node:18-alpine

# Set working directory to backend
WORKDIR /app/Maya/backend

# Copy package files first (for better caching)
COPY Maya/backend/package*.json ./

# Install dependencies
RUN npm install --production

# Copy backend application files
COPY Maya/backend/ ./

# Copy knowledge base (needed at runtime)
COPY Maya/knowledge/ ../knowledge/

# Copy frontend (needed for static file serving)
COPY Maya/frontend/ ../frontend/

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Start server
CMD ["node", "server.js"]
