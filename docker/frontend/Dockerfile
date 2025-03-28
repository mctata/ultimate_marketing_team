FROM nginx:stable-alpine

# Copy pre-built assets
COPY frontend/dist /usr/share/nginx/html

# Copy custom nginx config
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]