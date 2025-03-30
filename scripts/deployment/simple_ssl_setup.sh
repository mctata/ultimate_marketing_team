#!/bin/bash
# Script to generate self-signed SSL certificates for staging environment

set -e

DOMAIN=${1:-"staging.tangible-studios.com"}
echo "Generating SSL certificates for $DOMAIN"

# Create directories if they don't exist
mkdir -p docker/nginx/ssl

# Generate SSL certificate and key
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/$DOMAIN.key \
  -out docker/nginx/ssl/$DOMAIN.crt \
  -subj "/CN=$DOMAIN/O=Ultimate Marketing Team/C=US" \
  -addext "subjectAltName = DNS:$DOMAIN"

# Verify the certificate
openssl x509 -in docker/nginx/ssl/$DOMAIN.crt -text -noout | grep -E 'Subject:|Issuer:|Not Before:|Not After :|DNS:'

echo "SSL certificates generated successfully!"
echo "Certificate: docker/nginx/ssl/$DOMAIN.crt"
echo "Key: docker/nginx/ssl/$DOMAIN.key"

echo "These are self-signed certificates for testing. For production, use Let's Encrypt or another trusted Certificate Authority."