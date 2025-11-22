# Frontend Dockerfile for Land Registry Application
# Base: Node.js 18 Alpine for minimal image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port 5173 for Vite dev server
EXPOSE 5173

# CRITICAL: Run Vite with --host flag to bind to 0.0.0.0
# This makes the dev server accessible outside the container
# Without this, the server would only be reachable at localhost inside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
