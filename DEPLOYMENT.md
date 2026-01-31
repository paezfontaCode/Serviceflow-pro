# Deployment Guide: Ubuntu Server with Docker

This guide provides the steps to deploy **Serviceflow Pro ERP** on a fresh Ubuntu 22.04+ VPS.

## 1. System Requirements
- Ubuntu 22.04 LTS or newer
- 2GB RAM minimum (4GB recommended)
- Docker & Docker Compose installed

## 2. Install Docker
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker
```

## 3. Clone and Configure
```bash
git clone https://github.com/your-repo/serviceflow-pro.git
cd serviceflow-pro

# Copy environment variables
cp .env.production.example ./backend/.env
# EDIT .env with your unique SECRET_KEY and production database credentials
nano ./backend/.env
```

## 4. Run with Docker Compose
```bash
# Production mode (Detached)
docker-compose -f docker-compose.prod.yml up -d --build
```

## 5. First Time Setup (Migrations)
```bash
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## 6. SSL Configuration (Nginx & Certbot)
It is highly recommended to use a reverse proxy like Nginx with Certbot for SSL.

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Example Nginx Config (`/etc/nginx/sites-available/serviceflow`):
```nginx
server {
    server_name app.yourdomain.com;

    location / {
        proxy_pass http://localhost:5173; # Frontend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8000; # Backend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 7. Automated Backups
Schedule the backup script using cron:

```bash
# Make script executable
chmod +x scripts/backup_db.sh

# Open crontab
crontab -e
# Add this line for a daily backup at 2:00 AM
0 2 * * * /path/to/serviceflow-pro/scripts/backup_db.sh
```

## 8. Monitoring
Check logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f --tail 100
```
Visit the `/health` endpoint to verify system status.
