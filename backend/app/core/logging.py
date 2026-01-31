"""
Structured Logging Configuration for Serviceflow Pro

Provides JSON-formatted logs in production and human-readable logs in development.
Includes request ID tracking and sensitive data sanitization.
"""
import logging
import sys
from typing import Any, Dict, List
import structlog
from .config import settings


# Sensitive fields to redact from logs
SENSITIVE_FIELDS: List[str] = [
    "password",
    "secret",
    "token",
    "api_key",
    "apikey",
    "authorization",
    "secret_key",
    "access_token",
    "refresh_token",
    "credit_card",
    "ssn",
]


def sanitize_sensitive_data(
    logger: logging.Logger,
    method_name: str,
    event_dict: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Processor to sanitize sensitive data from logs.
    Replaces values of sensitive fields with [REDACTED].
    """
    def _sanitize(obj: Any) -> Any:
        if isinstance(obj, dict):
            return {
                k: "[REDACTED]" if any(s in k.lower() for s in SENSITIVE_FIELDS) else _sanitize(v)
                for k, v in obj.items()
            }
        elif isinstance(obj, list):
            return [_sanitize(item) for item in obj]
        return obj
    
    return _sanitize(event_dict)


def configure_logging() -> None:
    """Configure structured logging based on environment."""
    
    # Determine if we're in production
    is_production = settings.ENVIRONMENT == "production"
    
    # Set log level from settings
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Common processors
    common_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
        sanitize_sensitive_data,  # Sanitize sensitive data
    ]
    
    if is_production:
        # Production: JSON output
        processors = common_processors + [
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer()
        ]
    else:
        # Development: Human-readable output
        processors = common_processors + [
            structlog.dev.ConsoleRenderer()
        ]
    
    # Configure structlog
    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )
    
    # Quiet down noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def get_logger(name: str = __name__) -> structlog.stdlib.BoundLogger:
    """Get a configured logger instance."""
    return structlog.get_logger(name)


# Initialize logging on module import
configure_logging()

# Default logger for quick imports
logger = get_logger("serviceflow")
