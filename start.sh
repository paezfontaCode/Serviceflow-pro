#!/bin/bash
# Quick start script for Arch Linux / Mint / Ubuntu
# This script checks dependencies and starts the ServiceFlow application

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

set -e

echo -e "${BLUE}🚀 ServiceFlow Pro - Enterprise Startup Script${NC}"
echo "============================================="

# Function for connectivity test
check_connectivity() {
    echo -e "${BLUE}🔍 Probando conexión con Docker Hub...${NC}"
    if ping -c 1 registry-1.docker.io &> /dev/null; then
        echo -e "${GREEN}✅ Conexión exitosa con el registro de Docker.${NC}"
    else
        echo -e "${YELLOW}⚠️  No se pudo hacer ping a registry-1.docker.io.${NC}"
        echo "   Esto puede ser normal si el ICMP está bloqueado, probando con curl..."
        if curl -s --head https://registry-1.docker.io/v2/ &> /dev/null; then
            echo -e "${GREEN}✅ Conexión HTTPS exitosa.${NC}"
        else
            echo -e "${RED}❌ Error de conexión. El build podría fallar.${NC}"
        fi
    fi
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado.${NC}"
    echo "   Instalar con: sudo pacman -S docker (Arch) o sudo apt install docker.io (Ubuntu/Mint)"
    exit 1
fi

# Check for Docker Compose (v2 or v1)
DOCKER_COMPOSE_CMD=""
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
    echo -e "${GREEN}✅ Docker Compose (v2) detectado.${NC}"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
    echo -e "${YELLOW}⚠️  Docker Compose v1 detectado (Legacy). Se recomienda actualizar a v2.${NC}"
else
    echo -e "${RED}❌ Docker Compose no encontrado.${NC}"
    exit 1
fi

# Check if Docker service is running
if ! systemctl is-active --quiet docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  El servicio Docker no está activo.${NC}"
    echo "   Iniciando Docker..."
    sudo systemctl start docker
fi

# Check if user is in docker group
if ! groups | grep -q docker && [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Tu usuario no está en el grupo 'docker'.${NC}"
    echo "   Agrégalo con: sudo usermod -aG docker $USER"
    echo "   Luego cierra sesión y vuelve a entrar o usa 'sudo'."
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Archivo .env no encontrado.${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Archivo .env creado desde .env.example.${NC}"
    fi
fi

show_menu() {
    echo ""
    echo -e "${BLUE}Opciones Disponibles:${NC}"
    echo "1) 🔨 Construir e iniciar (con bypass de red p/ IPv6)"
    echo "2) 🚀 Iniciar servicios (sin reconstruir)"
    echo "3) 🛑 Detener servicios"
    echo "4) 📋 Ver logs (Todos)"
    echo "5) 📋 Ver logs (Backend únicamente)"
    echo "6) 📋 Ver logs (Frontend únicamente)"
    echo "7) 🔍 Diagnóstico de red"
    echo "8) 🗑️  Limpiar sistema (Prune)"
    echo "9) 💾 Crear backup de la base de datos"
    echo "10) ♻️ Restaurar backup"
    echo "11) 🧹 Reset total de base de datos (BORRA TODO)"
    echo "q) Salir"
    echo ""
}

while true; do
    show_menu
    read -p "Selecciona una opción: " option
    case $option in
        1)
            echo -e "${BLUE}🔨 Construyendo servicios...${NC}"
            echo -e "${YELLOW}ℹ️  Nota: Si el build falla por red, estamos usando DOCKER_BUILDKIT=0 para mayor compatibilidad.${NC}"
            DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 $DOCKER_COMPOSE_CMD up --build -d
            echo -e "${GREEN}✅ Proceso finalizado!${NC}"
            echo "   Frontend: http://localhost"
            echo "   Backend:  http://localhost:8000/docs"
            ;;
        2)
            echo -e "${BLUE}🚀 Iniciando servicios...${NC}"
            $DOCKER_COMPOSE_CMD up -d
            echo -e "${GREEN}✅ Servicios en línea.${NC}"
            ;;
        3)
            echo -e "${BLUE}🛑 Deteniendo servicios...${NC}"
            $DOCKER_COMPOSE_CMD down
            echo -e "${GREEN}✅ Servicios detenidos.${NC}"
            ;;
        4)
            $DOCKER_COMPOSE_CMD logs -f --tail=100
            ;;
        5)
            $DOCKER_COMPOSE_CMD logs -f backend
            ;;
        6)
            $DOCKER_COMPOSE_CMD logs -f frontend
            ;;
        7)
            check_connectivity
            ;;
        8)
            echo -e "${YELLOW}⚠️  Limpiando contenedores y redes no usadas...${NC}"
            $DOCKER_COMPOSE_CMD down --remove-orphans
            docker system prune -f --volumes
            echo -e "${GREEN}✅ Limpieza realizada.${NC}"
            ;;
        9)
            ./scripts/backup.sh
            ;;
        10)
            echo -e "${BLUE}📋 Backups disponibles:${NC}"
            ls -1 backups/*.sql.gz 2>/dev/null || echo "No hay backups."
            read -p "Ingresa la ruta del backup a restaurar: " backup_file
            if [ -f "$backup_file" ]; then
                ./scripts/restore.sh "$backup_file"
            else
                echo -e "${RED}Archivo no encontrado.${NC}"
            fi
            ;;
        11)
            echo -e "${RED}⚠️  ¡ADVERTENCIA! Esta acción borrará permanentemente todos los datos de la base de datos.${NC}"
            read -p "¿Estás ABSOLUTAMENTE seguro? (s/N): " confirm
            if [[ "$confirm" =~ ^([sS][iI]|[sS])$ ]]; then
                echo -e "${BLUE}🧹 Limpiando volúmenes de base de datos...${NC}"
                $DOCKER_COMPOSE_CMD down -v
                echo -e "${BLUE}🚀 Reiniciando servicios y recreando tablas...${NC}"
                $DOCKER_COMPOSE_CMD up -d
                echo -e "${BLUE}⏳ Esperando a que el backend esté listo...${NC}"
                sleep 5
                $DOCKER_COMPOSE_CMD exec -T backend python scripts/setup_database.py
                echo -e "${GREEN}✅ Base de datos reseteada y limpia.${NC}"
            else
                echo "Operación cancelada."
            fi
            ;;
        q)
            echo "Bye!"
            exit 0
            ;;
        *)
            echo -e "${RED}Opción inválida.${NC}"
            ;;
    esac
done
