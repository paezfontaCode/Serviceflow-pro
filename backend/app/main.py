"""
Serviceflow Pro ERP - Main Application Entry Point

Production-ready FastAPI application with:
- Rate limiting
- Structured logging
- Centralized error handling
- Request ID tracking
- CORS configuration
- Sentry error monitoring (optional)
"""
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .core.config import settings
from .core.logging import logger, configure_logging
from .core.exceptions import register_exception_handlers
from .api.v1 import (
    auth, customers, inventory, sales, finance, 
    repairs, dashboard, purchases, expenses, reports, 
    users, settings as settings_router, health
)


# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    logger.info(
        "Starting Serviceflow Pro",
        environment=settings.ENVIRONMENT,
        debug=settings.DEBUG
    )
    
    # Register Audit Listeners
    from .services.audit_service import register_audit_listeners
    register_audit_listeners()
    
    # Initialize Sentry if DSN is configured
    try:
        import os
        sentry_dsn = os.getenv("SENTRY_DSN")
        if sentry_dsn:
            import sentry_sdk
            from sentry_sdk.integrations.fastapi import FastApiIntegration
            from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
            
            sentry_sdk.init(
                dsn=sentry_dsn,
                integrations=[
                    FastApiIntegration(transaction_style="endpoint"),
                    SqlalchemyIntegration(),
                ],
                traces_sample_rate=0.1 if settings.ENVIRONMENT == "production" else 1.0,
                environment=settings.ENVIRONMENT,
            )
            logger.info("Sentry error monitoring initialized")
    except ImportError:
        logger.debug("Sentry SDK not installed, skipping initialization")
    except Exception as e:
        logger.warning(f"Failed to initialize Sentry: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Serviceflow Pro")


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="ERP para gestión de ventas y servicios técnicos con soporte dual USD/VES",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# Attach rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Register custom exception handlers
register_exception_handlers(app)


# Request ID Middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add unique request ID to each request for tracing."""
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    # Log incoming request
    logger.info(
        "Incoming request",
        request_id=request_id,
        method=request.method,
        path=str(request.url.path),
        client_ip=request.client.host if request.client else "unknown"
    )
    
    response = await call_next(request)
    
    # Add request ID to response headers
    response.headers["X-Request-ID"] = request_id
    
    # Log response
    logger.info(
        "Request completed",
        request_id=request_id,
        status_code=response.status_code
    )
    
    return response


# Gzip Compression Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS Middleware - Must be added LAST to be the OUTERMOST middleware
# This ensures it handles preflight requests before any other middleware
allowed_origins = settings.get_allowed_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)


# Register API routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["Users"])
app.include_router(settings_router.router, prefix=f"{settings.API_V1_STR}/settings", tags=["Settings"])
app.include_router(customers.router, prefix=f"{settings.API_V1_STR}/customers", tags=["Customers"])
app.include_router(inventory.router, prefix=f"{settings.API_V1_STR}/inventory", tags=["Inventory"])
app.include_router(sales.router, prefix=f"{settings.API_V1_STR}/sales", tags=["Sales"])
app.include_router(finance.router, prefix=f"{settings.API_V1_STR}/finance", tags=["Finance"])
app.include_router(repairs.router, prefix=f"{settings.API_V1_STR}/repairs", tags=["Repairs"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])
app.include_router(expenses.router, prefix=f"{settings.API_V1_STR}/expenses", tags=["Expenses"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Reports"])
app.include_router(purchases.router, prefix=f"{settings.API_V1_STR}/purchases", tags=["Purchases"])
app.include_router(health.router, prefix=f"{settings.API_V1_STR}", tags=["Health"])


@app.get("/", tags=["Health"])
def root():
    """Root endpoint - basic health check."""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

