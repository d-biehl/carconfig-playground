#!/bin/bash

# Setup script for secure .env.production file
# This script generates secure secrets and creates the .env.production file

set -e

echo "🔧 CarConfigurator Docker Environment Setup"
echo "=========================================="

# Check if .env.production already exists
if [ -f ".env.production" ]; then
    echo "⚠️  .env.production already exists!"
    read -p "Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 1
    fi
fi

echo "📝 Creating .env.production..."

# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d '\n')

# User input for domain
echo ""
echo "🌐 Domain Configuration:"
read -p "Your domain (e.g. localhost:3000 or yourdomain.com): " DOMAIN

# Determine protocol
if [[ $DOMAIN == *"localhost"* ]]; then
    PROTOCOL="http"
else
    PROTOCOL="https"
fi

NEXTAUTH_URL="${PROTOCOL}://${DOMAIN}"

# Create .env.production
cat > .env.production << EOF
# Environment variables for Docker deployment
# Automatically generated on $(date)

# Application
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Database
DATABASE_URL=file:./prisma/data/dev.db

# Seeding
SEED_ON_STARTUP=true
SKIP_SEED_IF_DATA_EXISTS=true

# Authentication - Automatically generated secure secrets
JWT_SECRET=${JWT_SECRET}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=${NEXTAUTH_URL}

# Internationalization
DEFAULT_LOCALE=en
LOCALES=en,de

# API Documentation
API_DOCS_ENABLED=true

# Security
ALLOWED_ORIGINS=${NEXTAUTH_URL}
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# Logging
LOG_LEVEL=info
EOF

echo "✅ .env.production successfully created!"
echo ""
echo "🔐 Secure secrets were generated:"
echo "   - JWT_SECRET: $(echo $JWT_SECRET | cut -c1-10)... ($(echo $JWT_SECRET | wc -c | tr -d ' ') characters)"
echo "   - NEXTAUTH_SECRET: $(echo $NEXTAUTH_SECRET | cut -c1-10)... ($(echo $NEXTAUTH_SECRET | wc -c | tr -d ' ') characters)"
echo "   - NEXTAUTH_URL: $NEXTAUTH_URL"
echo ""
echo "📁 The file .env.production has been created."
echo "⚠️  IMPORTANT: This file contains sensitive data and should NOT be checked into Git!"
echo ""
echo "🚀 You can now start Docker with:"
echo "   docker-compose up -d"
echo ""
echo "🔍 To review the configuration:"
echo "   cat .env.production"
