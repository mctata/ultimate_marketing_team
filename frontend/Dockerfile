FROM node:18-slim AS builder

WORKDIR /app

# Increase Node.js memory limit and use optimizations
ENV NODE_OPTIONS="--max-old-space-size=4096 --optimize-for-size --max_old_space_size=4096 --gc_interval=100"

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --no-optional --production=false

# Copy source files separately to optimize caching
COPY tsconfig.json tsconfig.node.json vite.config.ts postcss.config.js tailwind.config.js ./
COPY index.html ./
# Copy src directory (no public directory in this project)
COPY src ./src

# Copy simplified config for staging
COPY vite.staging.config.ts ./

# Create a simplified build script
RUN echo '#!/bin/sh\nNODE_ENV=production VITE_APP_ENV=production vite build --config vite.staging.config.ts --outDir=./dist' > build.sh && \
    chmod +x build.sh

# Run the build with minimal memory usage
RUN ./build.sh

# Production stage
FROM nginx:stable-alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]