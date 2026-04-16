from contextlib import contextmanager
from datetime import date
from decimal import Decimal
from typing import Optional, Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.config import settings
from ..models.user import User
from ..models.finance import CashSession, ExchangeRate
from ..schemas.user import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    """Obtener usuario actual desde el token JWT."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = db.query(User).filter(User.id == token_data.sub).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Verificar que el usuario esté activo."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_active_cash_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> CashSession:
    """
    Dependency para obtener la sesión de caja activa del usuario.
    Lanza HTTPException si no hay sesión abierta.
    """
    session = db.query(CashSession).filter(
        CashSession.user_id == current_user.id,
        CashSession.status == "open"
    ).first()
    if not session:
        raise HTTPException(
            status_code=400, 
            detail="Debes abrir una sesión de caja antes de realizar esta operación."
        )
    return session


def get_current_exchange_rate(
    db: Session = Depends(get_db)
) -> ExchangeRate:
    """
    Dependency para obtener la tasa de cambio activa.
    Lanza HTTPException si no hay tasa configurada.
    """
    rate = db.query(ExchangeRate).filter(
        ExchangeRate.is_active == True
    ).order_by(ExchangeRate.effective_date.desc()).first()
    
    if not rate:
        raise HTTPException(
            status_code=400,
            detail="No hay una tasa de cambio activa. Por favor, configúrela primero."
        )
    return rate


@contextmanager
def transaction_wrapper(db: Session) -> Generator[Session, None, None]:
    """
    Context manager para manejo consistente de transacciones.
    Usa savepoints (begin_nested) para rollback atómico en caso de error.
    
    Uso:
        with transaction_wrapper(db):
            # operaciones DB
            pass
    """
    try:
        with db.begin_nested():
            yield db
            db.commit()
    except Exception:
        db.rollback()
        raise


@contextmanager
def payment_transaction_wrapper(db: Session) -> Generator[Session, None, None]:
    """
    Context manager especializado para transacciones de pago.
    Incluye validaciones comunes y manejo de errores específico.
    """
    try:
        with db.begin_nested():
            yield db
            db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar la transacción: {str(e)}"
        )


def validate_payment_tolerance(amount: Decimal, tolerance: Decimal = Decimal('0.01')) -> bool:
    """
    Validar si un monto está dentro de la tolerancia permitida.
    Útil para manejar diferencias decimales mínimas.
    """
    return abs(amount) <= tolerance
