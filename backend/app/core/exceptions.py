"""
Custom Exception Handlers for Serviceflow Pro

Provides centralized error handling with proper logging and consistent API responses.
"""
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from typing import Any, Dict, Optional
import traceback

from .logging import get_logger

logger = get_logger("exceptions")


class ServiceflowException(Exception):
    """Base exception for Serviceflow application errors."""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or "INTERNAL_ERROR"
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(ServiceflowException):
    """Resource not found."""
    def __init__(self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=404, error_code="NOT_FOUND", details=details)


class ValidationError(ServiceflowException):
    """Validation error."""
    def __init__(self, message: str = "Validation error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=422, error_code="VALIDATION_ERROR", details=details)


class AuthenticationError(ServiceflowException):
    """Authentication failed."""
    def __init__(self, message: str = "Authentication required", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=401, error_code="AUTHENTICATION_ERROR", details=details)


class AuthorizationError(ServiceflowException):
    """Authorization failed - insufficient permissions."""
    def __init__(self, message: str = "Insufficient permissions", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=403, error_code="AUTHORIZATION_ERROR", details=details)


class BusinessLogicError(ServiceflowException):
    """Business rule violation."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=400, error_code="BUSINESS_ERROR", details=details)


class ExternalServiceError(ServiceflowException):
    """External service communication error."""
    def __init__(self, message: str = "External service error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=502, error_code="EXTERNAL_SERVICE_ERROR", details=details)


def create_error_response(
    status_code: int,
    error_code: str,
    message: str,
    details: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None
) -> JSONResponse:
    """Create a standardized error response."""
    content = {
        "success": False,
        "error": {
            "code": error_code,
            "message": message,
        }
    }
    
    if details:
        content["error"]["details"] = details
    
    if request_id:
        content["request_id"] = request_id
    
    return JSONResponse(status_code=status_code, content=content)


async def serviceflow_exception_handler(request: Request, exc: ServiceflowException) -> JSONResponse:
    """Handle Serviceflow custom exceptions."""
    request_id = getattr(request.state, "request_id", None)
    
    logger.warning(
        "Application error",
        error_code=exc.error_code,
        message=exc.message,
        status_code=exc.status_code,
        request_id=request_id,
        path=str(request.url.path),
    )
    
    return create_error_response(
        status_code=exc.status_code,
        error_code=exc.error_code,
        message=exc.message,
        details=exc.details,
        request_id=request_id
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle standard HTTP exceptions."""
    request_id = getattr(request.state, "request_id", None)
    
    logger.warning(
        "HTTP error",
        status_code=exc.status_code,
        detail=exc.detail,
        request_id=request_id,
        path=str(request.url.path),
    )
    
    return create_error_response(
        status_code=exc.status_code,
        error_code="HTTP_ERROR",
        message=str(exc.detail),
        request_id=request_id
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle request validation errors."""
    request_id = getattr(request.state, "request_id", None)
    
    # Format validation errors
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    logger.warning(
        "Validation error",
        errors=errors,
        request_id=request_id,
        path=str(request.url.path),
    )
    
    return create_error_response(
        status_code=422,
        error_code="VALIDATION_ERROR",
        message="Request validation failed",
        details={"errors": errors},
        request_id=request_id
    )


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions - catch-all handler."""
    request_id = getattr(request.state, "request_id", None)
    
    # Log full traceback for debugging
    logger.error(
        "Unexpected error",
        error=str(exc),
        error_type=type(exc).__name__,
        traceback=traceback.format_exc(),
        request_id=request_id,
        path=str(request.url.path),
    )
    
    # Don't expose internal error details in production
    from .config import settings
    if settings.ENVIRONMENT == "production":
        message = "An unexpected error occurred"
    else:
        message = f"{type(exc).__name__}: {str(exc)}"
    
    return create_error_response(
        status_code=500,
        error_code="INTERNAL_ERROR",
        message=message,
        request_id=request_id
    )


def register_exception_handlers(app):
    """Register all exception handlers with the FastAPI app."""
    app.add_exception_handler(ServiceflowException, serviceflow_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, global_exception_handler)
