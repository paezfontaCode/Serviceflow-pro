"""
Health Check Endpoints for Serviceflow Pro

Provides comprehensive health checks for monitoring and load balancer integration.
"""
from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text

from ...core.database import get_db
from ..deps import get_current_active_user
from ...core.config import settings
from ...core.logging import get_logger

router = APIRouter(tags=["Health"])
logger = get_logger("health")


@router.get("/health")
async def health_check(db: Session = Depends(get_db)) -> JSONResponse:
    """
    Comprehensive health check endpoint.
    
    Checks:
    - Database connectivity
    - Application configuration
    
    Returns 200 if healthy, 503 if any check fails.
    """
    health_status: Dict[str, Any] = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "checks": {}
    }
    
    # Check database connectivity
    try:
        db.execute(text("SELECT 1"))
        health_status["checks"]["database"] = {
            "status": "healthy",
            "message": "Database connection successful"
        }
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}"
        }
        logger.error("Health check failed: database", error=str(e))
    
    # Check configuration
    try:
        # Verify critical settings are configured
        config_issues = []
        
        if not settings.SECRET_KEY or len(settings.SECRET_KEY) < 32:
            config_issues.append("SECRET_KEY not properly configured")
        
        if settings.ENVIRONMENT == "production" and settings.DEBUG:
            config_issues.append("DEBUG is enabled in production")
        
        if config_issues:
            health_status["checks"]["configuration"] = {
                "status": "warning",
                "issues": config_issues
            }
        else:
            health_status["checks"]["configuration"] = {
                "status": "healthy",
                "message": "Configuration valid"
            }
    except Exception as e:
        health_status["checks"]["configuration"] = {
            "status": "unhealthy",
            "message": f"Configuration check failed: {str(e)}"
        }
    
    # Determine overall status code
    status_code = 200 if health_status["status"] == "healthy" else 503
    
    return JSONResponse(content=health_status, status_code=status_code)


@router.get("/health/live")
async def liveness_probe() -> Dict[str, str]:
    """
    Kubernetes liveness probe - simple check that the service is running.
    """
    return {"status": "alive"}


@router.get("/health/ready")
async def readiness_probe(db: Session = Depends(get_db)) -> JSONResponse:
    """
    Kubernetes readiness probe - checks if the service is ready to receive traffic.
    """
    try:
        db.execute(text("SELECT 1"))
        return JSONResponse(
            content={"status": "ready"},
            status_code=200
        )
    except Exception as e:
        logger.warning("Readiness check failed", error=str(e))
        return JSONResponse(
            content={"status": "not_ready", "reason": str(e)},
            status_code=503
        )
