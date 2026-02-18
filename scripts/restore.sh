#!/bin/bash
# Restore script for ServiceFlow Pro PostgreSQL
# Usage: ./scripts/restore.sh backups/serviceflow_2026-02-18.sql.gz

# Config
DB_CONTAINER="serviceflow-db"
DB_USER="postgres"
DB_NAME="serviceflow_db"

if [ -z "$1" ]; then
    echo "❌ Error: Debes especificar la ruta al archivo de backup."
    echo "Uso: $0 <ruta_al_backup>"
    exit 1
fi

BACKUP_PATH=$1

if [ ! -f "$BACKUP_PATH" ]; then
    echo "❌ Error: El archivo $BACKUP_PATH no existe."
    exit 1
fi

echo "⚠️  ADVERTENCIA: Esto sobrescribirá la base de datos actual. ¿Continuar? (s/n)"
read -r response
if [[ ! "$response" =~ ^([sS][iI]|[sS])$ ]]; then
    echo "🚫 Operación cancelada."
    exit 0
fi

echo "🔄 Restaurando base de datos desde $BACKUP_PATH..."

# Unzip and pipe to psql inside the container
if gunzip -c "$BACKUP_PATH" | docker exec -i $DB_CONTAINER psql -U $DB_USER $DB_NAME; then
    echo "✅ Restauración completada exitosamente."
else
    echo "❌ Error al restaurar el backup."
    exit 1
fi
