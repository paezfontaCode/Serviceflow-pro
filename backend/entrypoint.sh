#!/bin/bash
set -e

# Wait for database to be ready
echo "⌛ Esperando a Postgres..."
until pg_isready -h db -U postgres; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "🚀 Ejecutando Migraciones..."
python run_migrations.py

echo "🔥 Iniciando Servidor..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
