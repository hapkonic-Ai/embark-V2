ARG NODE_VERSION=20

# Stage 1: install dependencies and build the app
FROM node:${NODE_VERSION}-slim AS builder
WORKDIR /app

# Copy package manifests first so Docker can cache npm ci
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build frontend + backend bundle
COPY . .
RUN npm run build

# Stage 2: production image
FROM node:${NODE_VERSION}-slim AS production
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy build artifacts from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/boot.js"]
