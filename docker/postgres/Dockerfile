FROM postgres:17-alpine

# Install PostgreSQL contributed modules and build dependencies
RUN apk add --no-cache postgresql-contrib git build-base postgresql-dev

# Try to use preinstalled pgvector if available or build from source
RUN if [ -f /usr/local/share/postgresql/extension/vector.control ]; then \
      echo "Using preinstalled pgvector"; \
    else \
      echo "Building pgvector from source"; \
      git clone --branch v0.6.0 https://github.com/pgvector/pgvector.git /tmp/pgvector \
      && cd /tmp/pgvector \
      && make USE_PGXS=1 \
      && make USE_PGXS=1 install \
      && rm -rf /tmp/pgvector; \
    fi

# Copy SQL initialization files
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql
COPY install_pgvector.sql /docker-entrypoint-initdb.d/02-install_pgvector.sql
COPY integration_upgrade.sql /docker-entrypoint-initdb.d/03-integration_upgrade.sql

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD pg_isready -U postgres || exit 1