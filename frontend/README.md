# Serviceflow Pro - Frontend

Este es el cliente web para el sistema ERP Serviceflow Pro, construido con Next.js y Tailwind CSS.

## Características

- Interfaz moderna con tema oscuro premium y glassmorphism.
- Gestión de roles (Admin, Ventas, Técnico).
- Soporte para moneda dual (USD/VES).
- Integración en tiempo real con la API de FastAPI.

## Desarrollo Local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Configurar variables de entorno:
   Crea un archivo `.env.local`:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```

3. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Despliegue con Docker

Consulta el `README.md` en la raíz del proyecto para obtener instrucciones sobre cómo desplegar todo el sistema (Base de datos, Backend y Frontend) usando Docker Compose.
