FROM postgres:17-alpine

# Install dependencies
RUN apk add --no-cache git build-base postgresql-dev

# Build and install pgvector extension
RUN git clone https://github.com/pgvector/pgvector.git /tmp/pgvector \
    && cd /tmp/pgvector \
    && make \
    && make install \
    && rm -rf /tmp/pgvector

# Copy SQL initialization files
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql
COPY install_pgvector.sql /docker-entrypoint-initdb.d/02-install_pgvector.sql
COPY integration_upgrade.sql /docker-entrypoint-initdb.d/03-integration_upgrade.sql

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD pg_isready -U postgres || exit 1