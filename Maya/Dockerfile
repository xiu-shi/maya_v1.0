# Maya Backend Dockerfile
# For deployment on AI Builder Space / Koyeb platform

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY Maya/backend/package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY Maya/backend/ ./
COPY Maya/knowledge/ ../knowledge/
COPY Maya/frontend/ ../frontend/

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Start server
CMD ["node", "server.js"]
