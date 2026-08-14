# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the TypeScript project
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package.json and only install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the built files from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 5001

# Add HEALTHCHECK
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5001/health || exit 1

# Command to run the application
CMD ["npm", "start"]
