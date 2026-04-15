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

## Desarrollo: Pre-commit Hooks

Este proyecto utiliza pre-commit hooks para asegurar la calidad del código. Los hooks incluyen:

- **black**: Formateo automático de código Python.
- **isort**: Ordenamiento de imports.
- **flake8**: Linting del código.
- **mypy**: Verificación de tipos estáticos.

### Instalación

```bash
# Instalar pre-commit
pip install pre-commit

# Instalar los hooks en el repositorio local
pre-commit install

# (Opcional) Ejecutar hooks en todos los archivos existentes
pre-commit run --all-files
```

Los hooks se ejecutarán automáticamente antes de cada commit. Si un hook falla, el commit se cancelará y deberás corregir los problemas reportados.

### Configuración

- `.pre-commit-config.yaml`: Configuración de los hooks.
- `.flake8`: Configuración de flake8 (max-line-length=88).
- `.mypy.ini`: Configuración de mypy (ignora errores de SQLAlchemy dinámico).
