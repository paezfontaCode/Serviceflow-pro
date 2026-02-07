#!/bin/bash

# Configuration
# This script assumes the container name is 'serviceflow-db' and uses user 'serviceflow'
CONTAINER_NAME="serviceflow-db"
DB_USER="serviceflow"
DB_NAME="serviceflow_db"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Starting backup for database: $DB_NAME..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Execute pg_dump inside the container
if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$FILENAME"; then
    echo -e "${GREEN}Backup successful!${NC}"
    echo "Saved to: $FILENAME"
    
    # Compress the backup
    gzip "$FILENAME"
    echo "Compressed to: $FILENAME.gz"
    
    # Clean up old backups (keep last 7 days)
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete
    echo "Old backups older than 7 days have been cleaned up."
else
    echo -e "${RED}Backup failed!${NC}"
    exit 1
fi
