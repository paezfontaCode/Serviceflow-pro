#!/bin/bash

# Serviceflow Pro - Automated Database Backup Script
# This script performs a pg_dump of the PostgreSQL database, compresses it, 
# and saves it with a date prefix.

# --- Configuration ---
BACKUP_DIR="/backups"
DB_NAME="serviceflow"
DB_USER="postgres"
DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_NAME="backup_${DB_NAME}_${DATE}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting backup of ${DB_NAME} at $(date)"

# Perform backup using pg_dump
# Note: PGPASSWORD can be provided via environment or ~/.pgpass for automation
pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "${BACKUP_DIR}/${BACKUP_NAME}"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup successful: ${BACKUP_DIR}/${BACKUP_NAME}"
    
    # Optional: Keep only the last 30 days of backups
    find "$BACKUP_DIR" -type f -name "backup_${DB_NAME}_*.sql.gz" -mtime +30 -delete
    echo "Cleaned up backups older than 30 days."
else
    echo "Error: Backup failed!" >&2
    exit 1
fi

echo "Backup process finished at $(date)"
