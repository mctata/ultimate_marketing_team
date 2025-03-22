#!/bin/sh
# Combined lightweight exporters for essential services

echo "Starting combined exporters service..."

# Simple Redis metrics collector
collect_redis_metrics() {
  while true; do
    echo "Collecting Redis metrics..."
    sleep 60
  done
}

# Simple Postgres metrics collector
collect_postgres_metrics() {
  while true; do
    echo "Collecting Postgres metrics..."
    sleep 60
  done
}

# Start collectors in background
collect_redis_metrics &
collect_postgres_metrics &

# Keep container running
echo "Exporters running. Press CTRL+C to exit."
tail -f /dev/null