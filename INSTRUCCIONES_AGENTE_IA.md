# Serviceflow-pro: Instrucciones para Agente IA

---

## Introducción

Este documento contiene instrucciones paso a paso que un Agente IA puede seguir para implementar cada una de las mejoras identificadas en el análisis técnico del proyecto Serviceflow-pro.

**IMPORTANTE:** Estas instrucciones están organizadas por prioridad y categoría. El Agente IA debe seguir el orden sugerido (Fase 1 → Fase 2 → Fase 3 → Fase 4) para garantizar una implementación sistemática y segura.

---

## PRE-REQUISITOS ANTES DE COMENZAR

Antes de ejecutar cualquier instrucción, el Agente IA debe:

1. **Verificar acceso al repositorio:**
   ```bash
   cd /workspace/Serviceflow-pro
   git status
   ```

2. **Crear rama de trabajo:**
   ```bash
   git checkout -b feature/production-readiness
   ```

3. **Backup de estado actual:**
   ```bash
   git add .
   git commit -m "Backup: Estado antes de mejoras de producción"
   git push origin feature/production-readiness
   ```

---

## FASE 1: CRÍTICO - BLOQUEANTES DE PRODUCCIÓN

### 1.1 Configurar SECRET_KEY seguro

**Prioridad:** CRÍTICO  
**Archivo:** `backend/app/core/config.py`  
**Tiempo estimado:** 30 minutos

**Pasos:**

1. **Leer archivo de configuración actual:**
   ```bash
   cat backend/app/core/config.py
   ```

2. **Modificar Settings class para requerir SECRET_KEY desde variables de entorno:**
   
   El código debe incluir validación que requiera SECRET_KEY con mínimo 32 caracteres y falle si no está configurado.

3. **Actualizar .env.example con variable de SECRET_KEY:**
   
   ```bash
   # Security - CRITICAL: Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
   SECRET_KEY=your-secret-key-here-min-32-characters
   ```

**Resultado esperado:** El sistema ahora requiere un SECRET_KEY válido desde variables de entorno.

---

### 1.2 Restringir CORS a dominios específicos

**Prioridad:** CRÍTICO  
**Archivo:** `backend/app/main.py`  
**Tiempo estimado:** 15 minutos

**Pasos:**

1. **Modificar configuración de CORS** para aceptar solo dominios configurados en ALLOWED_ORIGINS

2. **Actualizar .env.example:**
   ```bash
   # CORS Configuration
   ALLOWED_ORIGINS=*
   ```

**Resultado esperado:** CORS restringido a dominios específicos.

---

### 1.3 Implementar rate limiting

**Prioridad:** CRÍTICO  
**Tiempo estimado:** 2 horas

**Pasos:**

1. Instalar dependencia `slowapi==0.1.9`
2. Configurar rate limiting en main.py
3. Agregar límite de 5 intentos por minuto al endpoint de login

**Resultado esperado:** Protección contra fuerza bruta y abuso de API.

---

### 1.4 Implementar sistema de logging estructurado

**Prioridad:** CRÍTICO  
**Tiempo estimado:** 3 horas

**Pasos:**

1. Instalar `structlog==23.2.0` y `python-json-logger==2.0.7`
2. Crear archivo `backend/app/core/logging.py`
3. Configurar logging estructurado con JSON en producción
4. Usar logging en endpoints clave

**Resultado esperado:** Logs estructurados y centralizados.

---

### 1.5 Implementar manejo de errores centralizado

**Prioridad:** CRÍTICO  
**Tiempo estimado:** 2 horas

**Pasos:**

1. Crear `backend/app/core/exceptions.py` con excepciones personalizadas
2. Registrar exception handlers en main.py
3. Reemplazar HTTPException con excepciones personalizadas

**Resultado esperado:** Manejo de errores consistente con logging automático.

---

### 1.6 Implementar health checks exhaustivos

**Prioridad:** CRÍTICO  
**Tiempo estimado:** 1 hora

**Pasos:**

1. Crear `backend/app/api/v1/health.py`
2. Implementar checks de base de datos y configuración
3. Registrar router en main.py

**Resultado esperado:** Health check completo para monitoreo.

---

### 1.7 Crear archivos .env de producción

**Prioridad:** CRÍTICO  
**Tiempo estimado:** 1 hora

**Pasos:**

1. Crear `backend/.env.production.example`
2. Crear `backend/.env.staging.example`
3. Actualizar README.md con instrucciones

**Resultado esperado:** Plantillas completas de configuración.

---

### 1.8 Implementar sanitización de secretos en logs

**Prioridad:** CRÍTICO  
**Tiempo estimado:** 1 hora

**Pasos:**

1. Crear processor de sanitización en logging.py
2. Redactar passwords, secrets, tokens, api_keys

**Resultado esperado:** Logs seguros sin credenciales expuestas.

---

## FASE 2: ALTO - REQUERIDOS PARA PRODUCCIÓN

### 2.1 Implementar test suite con pytest

**Prioridad:** ALTO  
**Tiempo estimado:** 3 días

**Pasos:**

1. Instalar pytest y dependencias
2. Crear estructura de tests
3. Crear fixtures de base de datos
4. Escribir tests unitarios y de integración

**Resultado esperado:** Suite de tests con reportes de cobertura.

---

### 2.2 Configurar pipeline de CI/CD con GitHub Actions

**Prioridad:** ALTO  
**Tiempo estimado:** 4 horas

**Pasos:**

1. Crear `.github/workflows/ci.yml`
2. Crear `.github/workflows/deploy-staging.yml`
3. Crear `.github/workflows/deploy-production.yml`

**Resultado esperado:** Pipeline automatizado de CI/CD.

---

### 2.3 Implementar monitoreo con Sentry

**Prioridad:** ALTO  
**Tiempo estimado:** 2 horas

**Pasos:**

1. Instalar sentry-sdk
2. Configurar Sentry en main.py
3. Configurar DSN en .env

**Resultado esperado:** Errores reportados automáticamente a Sentry.

---

### 2.4 Documentar API con OpenAPI/Swagger

**Prioridad:** ALTO  
**Tiempo estimado:** 1 día

**Pasos:**

1. Documentar endpoints con respuestas y ejemplos
2. Documentar modelos Pydantic
3. Actualizar main.py con metadatos

**Resultado esperado:** Documentación completa en /docs.

---

### 2.5 Implementar caching con Redis

**Prioridad:** ALTO  
**Tiempo estimado:** 4 horas

**Pasos:**

1. Instalar redis==5.0.1
2. Crear módulo de caché en cache.py
3. Usar caché en endpoints de tasas de cambio
4. Actualizar docker-compose.yml

**Resultado esperado:** Sistema de caché funcional mejorando performance.

---

## FASE 3: MEDIO - MEJORAS IMPORTANTES

### 3.1 Implementar tests E2E con Playwright

**Prioridad:** MEDIO  
**Tiempo estimado:** 2 días

### 3.2 Implementar dashboard de monitoreo

**Prioridad:** MEDIO  
**Tiempo estimado:** 3 días

---

## FASE 4: BAJO - OPTIMIZACIONES

### 4.1 Implementar PWA capabilities

**Prioridad:** BAJO  
**Tiempo estimado:** 4 horas

### 4.2 Optimizar bundle size

**Prioridad:** BAJO  
**Tiempo estimado:** 2 horas

---

## CONCLUSIÓN

**Tiempo total estimado:** 25-30 días de trabajo continuo con un desarrollador full-stack experimentado.

**NOTAS IMPORTANTES:**
1. Seguir el orden de prioridades
2. Verificar cada cambio antes de continuar
3. Documentar todo en commits descriptivos
4. Testear exhaustivamente antes de deployar
5. Pedir confirmación para cambios críticos