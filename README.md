<p align="center">
  <h1 align="center">ServiceFlow Pro</h1>
  <p align="center"><strong>Sistema ERP para Gestión de Ventas y Servicios Técnicos</strong></p>
  <p align="center">Facturación dual USD/VES · Pagos parciales · Inventario · Reparaciones · Reporting</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=for-the-badge" alt="Status"/>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge" alt="License"/>
</p>

---

## Descripción

ServiceFlow Pro es un ERP especializado en talleres de reparación de dispositivos móviles, diseñado para la realidad económica de Venezuela. Integra punto de venta omnicanal, gestión de reparaciones con trazabilidad, facturación dual (USD/VES) con tasa BCV en tiempo real, control de inventario, CRM de clientes, gestión financiera con sesiones de caja y reporting analítico.

### Flujo de Negocio

```
Recepción → Diagnóstico → Presupuesto → Abonos → Reparación → Entrega
```

---

## Stack Tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Backend** | FastAPI · Python 3.11 · SQLAlchemy · Pydantic V2 · JWT Auth |
| **Frontend** | React 18 · TypeScript · Tailwind CSS · TanStack Query · Zustand |
| **Base de Datos** | PostgreSQL 16 · Redis 7 (rate limiting & cache) |
| **Infraestructura** | Docker Compose · Nginx (reverse proxy) · Gunicorn/Uvicorn |
| **Reporting** | ReportLab (PDF) · Recharts (gráficos) · CSV exports |

---

## Características Principales

- **POS Omnicanal** — Búsqueda unificada de productos y órdenes de servicio en una sola interfaz
- **Facturación Dual** — Soporte USD/VES con tasa BCV sincronizada automáticamente
- **Gestión de Reparaciones** — Flujo Kanban con estados (Recibido → Diagnosticado → Presupuestado → En Reparación → Listo → Entregado)
- **Control de Inventario** — Stock en tiempo real, alertas de bajo stock, importación/exportación CSV, Kardex por producto
- **Sesiones de Caja** — Apertura/cierre con arqueo obligatorio y trazabilidad de diferencias
- **CRM de Clientes** — Historial de compras, cuentas por cobrar, bloqueo por morosidad
- **Abonos Inmutables** — Registro financiero con audit trail completo
- **Reportes & Analytics** — Dashboard con KPIs, P&L consolidado (PDF), distribución por categorías
- **Auditoría Global** — Logging de acciones con JSON diffs para trazabilidad
- **Internacionalización** — Soporte bilingüe ES/EN en la interfaz
- **Glassmorphism UI** — Diseño premium con efectos de desenfoque y micro-animaciones

---

## Estructura del Proyecto

```
serviceflow-pro/
├── backend/
│   ├── app/
│   │   ├── api/v1/        # 15 módulos de endpoints REST
│   │   ├── models/        # Modelos SQLAlchemy
│   │   ├── schemas/       # Validación Pydantic/Zod
│   │   ├── services/      # Lógica de negocio
│   │   └── core/          # Config, seguridad, DB
│   ├── Dockerfile
│   └── entrypoint.sh
├── frontend/
│   ├── src/
│   │   ├── pages/         # 13 módulos de interfaz
│   │   ├── components/    # UI reutilizable
│   │   ├── store/         # Estado (Cart, Auth, Rate)
│   │   ├── services/      # Clientes API (Axios)
│   │   ├── locales/       # i18n (es/en)
│   │   └── utils/         # Helpers monetarios
│   ├── Dockerfile
│   └── nginx.conf
├── scripts/
│   ├── backup.sh          # Backup PostgreSQL con rotación
│   └── restore.sh         # Restauración de backups
├── docker-compose.yml      # Desarrollo local
├── docker-compose.prod.yml # Producción
├── start.sh               # Script interactivo de gestión
└── .env.example            # Plantilla de configuración
```

---

## Requisitos Previos

- **Docker** ≥ 24.0 y **Docker Compose** ≥ 2.0
- **Git** para clonar el repositorio

> Para ejecución sin Docker: Python 3.11+, Node.js 20+, PostgreSQL 16+

---

## Instalación y Despliegue

### 🖥️ Opción 1: Desarrollo Local (Docker)

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/serviceflow-pro.git
cd serviceflow-pro

# 2. Configurar variables de entorno
cp .env.example .env
nano .env  # Cambiar POSTGRES_PASSWORD y SECRET_KEY

# 3. Generar una SECRET_KEY segura
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# 4. Construir e iniciar (o usar el script interactivo)
./start.sh
# Seleccionar opción 1: Construir e iniciar
```

**Acceso:**
| Servicio | URL |
|----------|-----|
| Frontend | http://localhost |
| API Docs | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

**Credenciales por defecto:** `admin` / `admin123`

---

### 🔌 Opción 2: Red Local (LAN del Taller)

Permite que múltiples dispositivos accedan al sistema desde la misma red WiFi.

```bash
# 1. Obtener la IP de tu máquina
ip addr show | grep "inet " | grep -v 127.0.0.1
# Ejemplo: 192.168.1.100

# 2. Actualizar CORS en .env
ALLOWED_ORIGINS=http://192.168.1.100,http://localhost

# 3. Iniciar servicios
docker compose up -d

# 4. Acceder desde cualquier dispositivo en la red
# http://192.168.1.100
```

---

### ☁️ Opción 3: Servidor en la Nube (VPS)

Para acceso remoto desde cualquier lugar. Compatible con DigitalOcean, Hetzner, AWS EC2, etc.

#### Paso 1: Preparar el Servidor

```bash
# Conectarse al servidor
ssh usuario@tu-servidor-ip

# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Clonar el proyecto
git clone https://github.com/tu-usuario/serviceflow-pro.git
cd serviceflow-pro
```

#### Paso 2: Configurar para Producción

```bash
# Crear archivo de entorno desde la plantilla de producción
cp docs/env-examples/production.env.example .env
nano .env
```

Variables **obligatorias** a configurar:

```env
# Generar con: python3 -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=tu_clave_unica_generada_aqui

# Solo tu dominio o IP pública
ALLOWED_ORIGINS=https://app.tudominio.com

# Credenciales únicas para PostgreSQL
POSTGRES_USER=serviceflow_admin
POSTGRES_PASSWORD=tu_contraseña_muy_segura

# Modo producción
ENVIRONMENT=production
DEBUG=false
```

#### Paso 3: Desplegar

```bash
# Usar el Docker Compose de producción
docker compose -f docker-compose.prod.yml up -d --build

# Verificar que todo esté corriendo
docker compose -f docker-compose.prod.yml ps
```

#### Paso 4: Configurar HTTPS (Recomendado)

Para HTTPS con certificado gratuito de Let's Encrypt, se recomienda usar **Nginx Proxy Manager** como contenedor adicional, o configurar **Caddy** como reverse proxy frente al frontend.

#### Paso 5: Configurar Backups Automáticos

```bash
# Editar crontab
crontab -e

# Agregar backup diario a las 3:00 AM
0 3 * * * cd /ruta/a/serviceflow-pro && ./scripts/backup.sh
```

---

### 🔧 Opción 4: Ejecución Manual (sin Docker)

#### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run_migrations.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

> ⚠️ Requiere PostgreSQL y Redis corriendo localmente o configurados en `.env`.

---

## Gestión de Backups

El sistema incluye herramientas integradas para proteger los datos del negocio:

```bash
# Crear backup manual
./scripts/backup.sh

# Restaurar desde un backup
./scripts/restore.sh backups/serviceflow_2026-02-18.sql.gz

# También disponible desde el menú interactivo
./start.sh  # Opciones 9 y 10
```

Los backups se guardan comprimidos en `backups/` con rotación automática de 7 días.

---

## Script de Gestión (`start.sh`)

```
 1) 🔨 Construir e iniciar
 2) 🚀 Iniciar servicios
 3) 🛑 Detener servicios
 4) 📋 Ver logs (Todos)
 5) 📋 Ver logs (Backend)
 6) 📋 Ver logs (Frontend)
 7) 🔍 Diagnóstico de red
 8) 🗑️  Limpiar sistema
 9) 💾 Crear backup
10) ♻️  Restaurar backup
```

---

## Variables de Entorno

| Variable | Descripción | Default (Dev) | Producción |
|----------|-------------|---------------|------------|
| `SECRET_KEY` | Clave para firmar tokens JWT | dev key | **Generar única** |
| `ALLOWED_ORIGINS` | Dominios con acceso a la API | localhost | Solo tu dominio |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | postgres | **Contraseña fuerte** |
| `ENVIRONMENT` | Modo de ejecución | development | production |
| `DEBUG` | Habilitar modo debug | true | **false** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Duración del token | 10080 (7 días) | 10080 |

---

## Seguridad

- **JWT Authentication** con tokens firmados y expiración configurable
- **Rate Limiting** en endpoints de login (5 intentos/minuto)
- **CORS** restringido a orígenes autorizados
- **Audit Trail** inmutable para operaciones financieras
- **Validación Zod/Pydantic** en todas las entradas de datos
- **Nginx Security Headers** (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- Puertos internos (PostgreSQL, Redis) **cerrados** en configuración de producción

---

## API Endpoints

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Auth | `/api/v1/auth` | Login, registro, recuperación de contraseña |
| Users | `/api/v1/users` | Gestión de usuarios y roles |
| Dashboard | `/api/v1/dashboard` | KPIs y métricas en tiempo real |
| Sales | `/api/v1/sales` | Ventas, abonos, cuentas por cobrar |
| Repairs | `/api/v1/repairs` | Órdenes de trabajo, estados, diagnósticos |
| Inventory | `/api/v1/inventory` | Productos, stock, categorías, Kardex |
| Customers | `/api/v1/customers` | CRM, historial, morosidad |
| Finance | `/api/v1/finance` | Sesiones de caja, morosos, resumen |
| Expenses | `/api/v1/expenses` | Gastos operativos |
| Purchases | `/api/v1/purchases` | Compras a proveedores |
| Reports | `/api/v1/reports` | P&L, ventas mensuales, distribución |
| Audit | `/api/v1/audit` | Logs de auditoría |
| Settings | `/api/v1/settings` | Configuración del sistema |
| Health | `/api/v1/health` | Estado de servicios |

Documentación interactiva disponible en `/docs` (Swagger UI).

---

## 🗺️ Roadmap de Desarrollo

### ✅ Fase 1 - Core (Completado)
- [x] Autenticación JWT
- [x] CRUD de ventas y reparaciones
- [x] Sistema de abonos
- [x] Inventario básico
- [x] Facturación dual USD/VES

### 🔄 Fase 2 - Avanzado (En progreso)
- [ ] Dashboard analítico avanzado
- [ ] Notificaciones push/email
- [ ] Exportación a PDF/Excel mejorada
- [ ] Roles y permisos avanzados
- [ ] Auditoría de cambios en tiempo real

### 📅 Fase 3 - Futuro
- [ ] App móvil (React Native)
- [ ] Integración con pasarelas de pago
- [ ] Módulo de compras a proveedores
- [ ] API pública para integraciones
- [ ] Multi-tenant (SaaS)

---

## 🤝 Contributing Guidelines

¡Las contribuciones son bienvenidas! Sigue estos pasos:

### 1. Fork del Proyecto
```bash
git fork https://github.com/tu-usuario/serviceflow-pro.git
```

### 2. Crear Rama de Feature
```bash
git checkout -b feature/nueva-funcionalidad
```

### 3. Desarrollar
- Escribe tests para nuevas funcionalidades
- Mantén el código formateado (`black`, `isort`)
- Sigue las convenciones de nombres existentes
- Documenta cambios importantes

### 4. Commit Messages
Usa [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: agregar reporte de ventas mensuales
fix: corregir cálculo de IVA en abonos
docs: actualizar README con ejemplos
refactor: optimizar queries de inventory
test: agregar tests para modelo Sale
```

### 5. Pull Request
- Describe claramente los cambios
- Incluye screenshots si aplica
- Asegúrate que todos los tests pasan
- Solicita review a mantenedores

### Código de Conducta
- Sé respetuoso con otros contribuidores
- Proporciona feedback constructivo
- Mantén un ambiente inclusivo

---

## 🛠️ Comandos Útiles

### Backend
```bash
# Instalar dependencias
pip install -r backend/requirements.txt

# Ejecutar tests
pytest backend/tests -v

# Tests con coverage
pytest backend/tests --cov=backend/app --cov-report=html

# Linting
flake8 backend/app
black backend/app --check
isort backend/app --check

# Type checking
mypy backend/app

# Crear migración
alembic revision --autogenerate -m "Descripción del cambio"

# Aplicar migraciones
alembic upgrade head
```

### Frontend
```bash
cd frontend

# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build producción
npm run build

# Linting
npm run lint
```

### Pre-commit Hooks
```bash
# Instalar hooks
pip install pre-commit
pre-commit install

# Ejecutar manualmente
pre-commit run --all-files
```

---

## 📄 License

Este proyecto está bajo la licencia **MIT**.

```
Copyright (c) 2024 ServiceFlow Pro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Soporte y Contacto

- 📧 Email: soporte@serviceflow.pro
- 💬 Issues: [GitHub Issues](https://github.com/tu-usuario/serviceflow-pro/issues)
- 📚 Wiki: [Documentación Completa](https://github.com/tu-usuario/serviceflow-pro/wiki)

---

<div align="center">

**Hecho con ❤️ para talleres de servicio técnico**

⭐ Si te gusta este proyecto, ¡dale una estrella!

</div>
