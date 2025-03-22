FROM node:18-alpine as build

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY frontend/package*.json ./

# Use --omit=dev to avoid installing dev dependencies
RUN npm ci --omit=dev --no-audit --no-fund

# Copy only necessary files
COPY frontend/public ./public
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/tsconfig*.json ./
COPY frontend/vite.config.ts ./
COPY frontend/postcss.config.js ./
COPY frontend/tailwind.config.js ./

# Build with environment variables for production
ENV NODE_ENV=production
RUN npm run build

# Use lightweight nginx for serving
FROM nginx:stable-alpine

# Copy build artifacts
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]