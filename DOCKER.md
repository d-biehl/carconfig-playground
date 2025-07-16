# CarConfigurator Docker Setup

This guide explains how to run the CarConfigurator application with Docker.

## Prerequisites

- Docker (Version 20.10 or higher)
- Docker Compose (Version 2.0 or higher)

> **Note:** This setup uses modern Docker Compose format without version specification, compatible with Docker Compose v2+.

## Quick Start

### 1. Production Environment with Docker Compose

```bash
# 2. Create environment file
npm run env:setup

# 3. Start application
docker-compose up -d

# 4. Application available at http://localhost:3000
```

### 2. Development Environment with Hot Reloading

```bash
# Start development server with Docker Compose
docker-compose -f docker-compose.dev.yml up

# Or with npm script
npm run docker:compose:dev
```

## Available Docker Commands

### Environment Setup Commands
```bash
# Automated setup with secure secrets (Recommended)
npm run env:setup

# Manual setup - copy template
npm run env:copy

# Check if environment is configured
npm run env:check
```

### Build Commands
```bash
# Production Build
npm run docker:build

# Development Build
npm run docker:build:dev
```

### Run Commands
```bash
# Production Container start
npm run docker:compose:up

# Development Container start
npm run docker:compose:dev

# Production with Nginx Reverse Proxy
npm run docker:compose:prod
```

### Management Commands
```bash
# Show logs
npm run docker:logs

# Stop containers
npm run docker:compose:down

# Cleanup system (Warning: Deletes unused images and volumes)
npm run docker:clean
```

## Configuration

### Environment Variables

Create a `.env.production` file using the automated setup:

```bash
npm run env:setup
```

Or manually copy the template:
```bash
npm run env:copy
```

Important variables:
- `JWT_SECRET`: Strong secret for JWT tokens
- `NEXTAUTH_SECRET`: Secret for NextAuth
- `NEXTAUTH_URL`: Base URL of your application
- `DATABASE_URL`: Database connection
- `SEED_ON_STARTUP`: Enable/disable automatic seeding (default: true)
- `SKIP_SEED_IF_DATA_EXISTS`: Skip seeding if data exists (default: true)

### Database

The SQLite database is persisted in Docker volumes:
- Production: `db_data` volume
- Development: `dev_db_data` volume

#### Demo Data

The container automatically seeds the database with demo data on first startup:

**Admin User:**
- Email: `admin@carconfigurator.com`
- Password: `admin123`
- Role: Administrator (full access)

**Test User:**
- Email: `user@carconfigurator.com`
- Password: `user123`
- Role: Regular user

**Sample Cars & Options:**
- Multiple car models with realistic configurations
- Various option categories (Interior, Exterior, Technology, etc.)
- Complete pricing information
- Multilingual support (English/German)

#### Seeding Control

Environment variables to control seeding:
- `SEED_ON_STARTUP=true` - Enable automatic seeding
- `SKIP_SEED_IF_DATA_EXISTS=true` - Skip if database has data

### Volumes

- `db_data`: Production database
- `uploads_data`: Uploaded files (if implemented)

## Production Deployment

For a production environment with Nginx reverse proxy:

```bash
# Start all services including Nginx
docker-compose --profile production up -d
```

This starts:
- CarConfigurator App (Port 3000 internal)
- Nginx Reverse Proxy (Port 80/443)

### SSL/HTTPS Setup

1. Place SSL certificates in `./ssl/` directory
2. Adjust Nginx configuration in `nginx.conf` for HTTPS
3. Start Docker Compose with production profile

## Monitoring

### Health Checks

The application includes a health check endpoint:
- URL: `http://localhost:3000/api/health`
- Status: 200 = Healthy, 503 = Unhealthy

### Logs

```bash
# Show all logs
docker-compose logs

# Show only app logs
docker-compose logs carconfigurator

# Follow live logs
docker-compose logs -f carconfigurator
```

## Troubleshooting

### Container won't start
```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs carconfigurator

# Restart container
docker-compose restart carconfigurator
```

### Database issues
```bash
# Login to container
docker-compose exec carconfigurator sh

# Run Prisma commands
npx prisma migrate deploy
npx prisma db seed
```

### Cleanup disk space
```bash
# Remove unused Docker objects
npm run docker:clean

# Or manually
docker system prune -a
docker volume prune
```

## Development Workflow

### Code changes with Hot Reloading

```bash
# Start development container
npm run docker:compose:dev

# Make code changes - updates automatically
# Database changes require container restart
```

### Reset database

```bash
# Reset development database
docker-compose -f docker-compose.dev.yml exec carconfigurator-dev npx prisma migrate reset --force
```

## Security Considerations

### Production Environment
- Change all default passwords and secrets
- Use HTTPS in production
- Set `NODE_ENV=production`
- Configure firewall rules
- Regular updates of Docker images

### Development
- Don't use production data
- Don't use development containers in production
- Secrets should not be embedded in development images

## Performance Optimization

### Multi-Stage Build
The Dockerfile uses multi-stage builds for optimal image size:
- Dependencies Stage: Production dependencies only
- Builder Stage: Build process
- Runner Stage: Minimal runtime image

### Caching
- Docker layer caching for faster builds
- Next.js build cache
- Nginx caching for static assets

## Backup and Recovery

### Database Backup
```bash
# Backup database volume
docker run --rm -v carconfigurator_db_data:/data -v $(pwd):/backup alpine tar czf /backup/db-backup.tar.gz -C /data .

# Restore backup
docker run --rm -v carconfigurator_db_data:/data -v $(pwd):/backup alpine tar xzf /backup/db-backup.tar.gz -C /data
```

## Environment Setup Details

### Automated Setup (Recommended)

The automated setup script generates secure secrets and configures your environment:

```bash
npm run env:setup
```

This script:
- Generates cryptographically secure JWT secrets
- Prompts for your domain configuration
- Creates a complete `.env.production` file
- Provides security recommendations

### Manual Setup

If you prefer manual configuration:

```bash
# Copy template
npm run env:copy

# Edit the file
nano .env.production

# Check configuration
npm run env:check
```

### Security Best Practices

1. **Never** commit `.env.production` to Git
2. **Always** use strong, random secrets
3. **Use separate** environment files for each environment
4. **Regularly rotate** secrets in production
5. **Restrict** file permissions: `chmod 600 .env.production`
