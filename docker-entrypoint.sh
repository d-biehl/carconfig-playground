#!/bin/sh

# Docker startup script
# Handles database migration, seeding, and application startup

set -e

echo "�� Starting CarConfigurator Docker Container..."

# Extract database path from DATABASE_URL environment variable
# DATABASE_URL format: file:./data/dev.db
DB_FILE_PATH=""
if [ ! -z "$DATABASE_URL" ]; then
    # Remove 'file:' prefix and resolve relative path
    DB_RELATIVE_PATH=$(echo "$DATABASE_URL" | sed 's/^file://')
    # Clean up the path - remove leading ./ if present
    DB_RELATIVE_PATH=$(echo "$DB_RELATIVE_PATH" | sed 's/^\.\///')
    # Resolve to absolute path within container
    DB_FILE_PATH="/app/$DB_RELATIVE_PATH"
    echo "📍 Database path from env: $DB_FILE_PATH"
else
    echo "⚠️  DATABASE_URL not set, using default path"
    DB_FILE_PATH="/app/data/dev.db"
fi

# Check if database exists, if not initialize it
if [ ! -f "$DB_FILE_PATH" ]; then
    echo "📦 Database not found, creating new database..."
    mkdir -p "$(dirname "$DB_FILE_PATH")"
fi

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Check if database is empty (no users table or no data)
# Check both file existence, size and table structure
USER_COUNT=0
if [ -f "$DB_FILE_PATH" ] && [ -s "$DB_FILE_PATH" ]; then
    # File exists and is not empty, check if users table exists and has data
    USER_COUNT=$(echo "SELECT COUNT(*) FROM users;" | sqlite3 "$DB_FILE_PATH" 2>/dev/null || echo "0")
    echo "📊 Found $USER_COUNT users in database"
else
    echo "📦 Database file is empty or doesn't exist"
fi

# Seeding logic with environment variable control
if [ "${SEED_ON_STARTUP:-true}" = "true" ]; then
    if [ "${SKIP_SEED_IF_DATA_EXISTS:-true}" = "true" ] && [ "$USER_COUNT" != "0" ] && [ "$USER_COUNT" != "" ]; then
        echo "📊 Database already contains data (Users: $USER_COUNT), skipping seed..."
    else
        echo "🌱 Seeding database with demo data..."
        npx prisma db seed
        echo "✅ Demo data successfully seeded!"
        echo "👤 Admin user: admin@carconfigurator.com / admin123"
        echo "👤 Test user: user@carconfigurator.com / user123"
    fi
else
    echo "⏭️  Seeding disabled via SEED_ON_STARTUP=false"
    echo "👤 To enable seeding: set SEED_ON_STARTUP=true in .env.production"
fi

# Generate Prisma client (in case of version mismatches)
echo "🔧 Generating Prisma client..."
npx prisma generate

# Start the application
echo "🎯 Starting Next.js application..."
exec "$@"
