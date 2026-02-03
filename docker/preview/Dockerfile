# Preview Server Dockerfile
FROM node:20-alpine

# Install dependencies for Expo
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files
COPY apps/preview-server/package*.json ./
RUN npm install

# Copy source code
COPY apps/preview-server/src ./src
COPY apps/preview-server/tsconfig.json ./

# Copy Expo template
COPY packages/expo-template /template

# Build TypeScript
RUN npm run build || npx tsc

# Create projects directory
RUN mkdir -p /projects

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV PROJECTS_DIR=/projects
ENV TEMPLATE_DIR=/template

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "dist/index.js"]
