# Guía de Despliegue: ServiceFlow Pro

Esta guía detalla cómo llevar ServiceFlow Pro de tu entorno local a un entorno de producción (LAN del taller o Servidor VPS).

## 🚀 Checklist Pre-Vuelo
1. **SECRET_KEY**: Generar una única y segura.
2. **CORS**: Configurar solo los dominios autorizados.
3. **Database**: Cambiar contraseñas por defecto de Postgres.
4. **Modo**: Asegurar `ENVIRONMENT=production` y `DEBUG=false`.

---

## 🏗️ Opción 1: Despliegue en Red Local (LAN)
Ideal para que varios técnicos accedan desde diferentes laptops/tablets en la misma red.

1. **Obtén la IP de tu servidor local**:
   ```bash
   ip addr show | grep inet
   # Ejemplo: 192.168.1.100
   ```
2. **Configura el `.env`**:
   ```env
   ALLOWED_ORIGINS=http://192.168.1.100
   ```
3. **Inicia los servicios**:
   ```bash
   docker compose up -d
   ```

---

## 🌐 Opción 2: Despliegue en Servidor Remoto (VPS)
Para acceso desde cualquier lugar del mundo.

### 1. Preparación del Servidor
- Servidor Linux (Ubuntu/Debian recomendado).
- Docker y Docker Compose instalados.

### 2. Configuración de Seguridad (Docker Compose Prod)
Usa el archivo optimizado para producción:
```bash
docker compose -f docker-compose.prod.yml up -d
```

### 3. Certificados SSL (HTTPS)
Se recomienda usar **Nginx Proxy Manager** o **Traefik** como contenedor frontal para gestionar certificados Let's Encrypt automáticamente.

---

## 🔑 Gestión de Credenciales
Genera una clave segura para tu producción:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 💾 Mantenimiento y Backups
Configura un cronjob para automatizar los backups diarios:

1. Edita tus tareas programadas: `crontab -e`
2. Agrega la línea para ejecutar a las 3 AM:
   ```cron
   0 3 * * * /ruta/absoluta/a/Serviceflow-pro/scripts/backup.sh
   ```

---
*ServiceFlow Pro — Código que sobrevive al hype.*
