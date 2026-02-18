#!/bin/bash
# Backup script for ServiceFlow Pro PostgreSQL
# Save this as scripts/backup.sh

# Config
BACKUP_DIR="./backups"
DB_CONTAINER="serviceflow-db"
DB_USER="postgres"
DB_NAME="serviceflow_db"
DATE=$(date +%Y-%m-%d)
FILENAME="serviceflow_${DATE}.sql.gz"

# Create backup dir if not exists
mkdir -p $BACKUP_DIR

echo "📦 Iniciando backup de la base de datos..."

# Run pg_dump inside the container and compress on the host
if docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/$FILENAME"; then
    echo "✅ Backup completado exitosamente: $BACKUP_DIR/$FILENAME"
    
    # Rotation: Keep last 7 days
    echo "♻️  Limpiando backups antiguos (más de 7 días)..."
    find "$BACKUP_DIR" -name "serviceflow_*.sql.gz" -mtime +7 -delete
    
    echo "✨ Proceso de limpieza finalizado."
else
    echo "❌ Error al realizar el backup."
    exit 1
fi
