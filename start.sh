#!/bin/bash
# Quick start script for Arch Linux
# This script checks dependencies and starts the ServiceFlow application

set -e

echo "🚀 ServiceFlow Pro - Arch Linux Quick Start"
echo "============================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado."
    echo "   Instalar con: sudo pacman -S docker"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado."
    echo "   Instalar con: sudo pacman -S docker-compose"
    exit 1
fi

# Check if Docker service is running
if ! systemctl is-active --quiet docker; then
    echo "⚠️  El servicio Docker no está activo."
    echo "   Iniciando Docker..."
    sudo systemctl start docker
fi

# Check if user is in docker group
if ! groups | grep -q docker; then
    echo "⚠️  Tu usuario no está en el grupo 'docker'."
    echo "   Agrégalo con: sudo usermod -aG docker $USER"
    echo "   Luego cierra sesión y vuelve a entrar."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Archivo .env no encontrado."
    echo "   Creando desde .env.example..."
    cp .env.example .env
    echo "✅ Archivo .env creado. Edita las configuraciones si es necesario."
fi

echo ""
echo "✅ Todas las dependencias están instaladas"
echo ""
echo "Opciones:"
echo "1) Construir e iniciar servicios (primera vez o después de cambios)"
echo "2) Iniciar servicios (sin reconstruir)"
echo "3) Detener servicios"
echo "4) Ver logs"
echo "5) Limpiar todo (contenedores, imágenes, volúmenes)"
echo ""
read -p "Selecciona una opción (1-5): " option

case $option in
    1)
        echo "🔨 Construyendo e iniciando servicios..."
        docker-compose up --build -d
        echo ""
        echo "✅ Servicios iniciados!"
        echo "   Frontend: http://localhost"
        echo "   Backend API: http://localhost:8000"
        echo "   API Docs: http://localhost:8000/docs"
        echo ""
        echo "Ver logs con: docker-compose logs -f"
        ;;
    2)
        echo "🚀 Iniciando servicios..."
        docker-compose up -d
        echo "✅ Servicios iniciados!"
        ;;
    3)
        echo "🛑 Deteniendo servicios..."
        docker-compose down
        echo "✅ Servicios detenidos"
        ;;
    4)
        echo "📋 Mostrando logs (Ctrl+C para salir)..."
        docker-compose logs -f
        ;;
    5)
        echo "🗑️  Limpiando todo..."
        read -p "¿Estás seguro? Esto eliminará todos los datos (s/N): " confirm
        if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
            docker-compose down -v
            docker system prune -a -f
            echo "✅ Limpieza completa"
        else
            echo "Cancelado"
        fi
        ;;
    *)
        echo "Opción inválida"
        exit 1
        ;;
esac
