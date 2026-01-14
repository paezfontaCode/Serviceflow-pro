# Serviceflow Pro - Backend

API RESTful construida con FastAPI para el sistema ERP Serviceflow Pro.

## Características

- Autenticación JWT.
- Gestión de inventario, ventas, reparaciones y finanzas.
- Soporte para PostgreSQL y SQLite.
- Integración con moneda dual (USD/VES).

## Instalación Local (Sin Docker)

1. Crear un entorno virtual:

   ```bash
   python -m venv venv
   source venv/bin/activate  # o venv\Scripts\activate en Windows
   ```

2. Instalar dependencias:

   ```bash
   pip install -r requirements.txt
   ```

3. Configurar variables de entorno:
   Copia `.env.example` a `.env` y ajusta según sea necesario.

4. Inicializar la base de datos:

   ```bash
   python init_db.py
   ```

5. Iniciar el servidor:
   ```bash
   uvicorn app.main:app --reload
   ```

## Despliegue con Docker

Consulta el `README.md` en la raíz del proyecto para obtener instrucciones sobre cómo desplegar todo el sistema usando Docker Compose.
