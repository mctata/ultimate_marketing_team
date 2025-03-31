FROM postgres:17-alpine

# Install PostgreSQL contributed modules and build dependencies
# Include clang and llvm for comprehensive build support
RUN apk add --no-cache \
    postgresql-contrib \
    git \
    build-base \
    postgresql-dev \
    clang \
    llvm \
    openssl-dev \
    zlib-dev

# Install pgvector from source with specific version
RUN echo "Building pgvector from source"; \
    git clone --branch v0.6.0 https://github.com/pgvector/pgvector.git /tmp/pgvector \
    && cd /tmp/pgvector \
    && echo "Attempting to build with standard options first" \
    && if ! make USE_PGXS=1; then \
         echo "Standard build failed, trying with JIT disabled"; \
         sed -i 's/USE_PGXS=1 clean/USE_PGXS=1 NO_JIT=1 clean/g' Makefile \
         && sed -i 's/USE_PGXS=1 all/USE_PGXS=1 NO_JIT=1 all/g' Makefile \
         && sed -i 's/USE_PGXS=1 install/USE_PGXS=1 NO_JIT=1 install/g' Makefile \
         && make USE_PGXS=1 NO_JIT=1; \
       fi \
    && make USE_PGXS=1 install \
    && echo "CREATE EXTENSION vector;" > /tmp/create_extension.sql \
    && rm -rf /tmp/pgvector

# Create a PG extension verification script
COPY scripts/verify_pgvector.sh /usr/local/bin/verify_pgvector.sh
RUN chmod +x /usr/local/bin/verify_pgvector.sh

# Copy SQL initialization files
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql
COPY install_pgvector.sql /docker-entrypoint-initdb.d/02-install_pgvector.sql
COPY integration_upgrade.sql /docker-entrypoint-initdb.d/03-integration_upgrade.sql

# Health check verifies pgvector extension availability
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD pg_isready -U postgres && psql -U postgres -c "SELECT count(*) FROM pg_extension WHERE extname = 'vector';" | grep -q 1 || exit 1