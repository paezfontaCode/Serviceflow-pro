from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from ...core.database import get_db
from ...core.security import create_access_token, verify_password
from ...core.config import settings
from ...core.logging import get_logger
from ...models.user import User
from ...schemas.user import Token, UserRead, ForgotPassword, ResetPassword
from ..deps import get_current_active_user

router = APIRouter(tags=["auth"])
logger = get_logger("auth")

# Create rate limiter for this router
limiter = Limiter(key_func=get_remote_address)


@router.post("/login", response_model=Token)
@limiter.limit(settings.LOGIN_RATE_LIMIT)
def login(
    request: Request,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Authenticate user and return JWT access token.
    
    Rate limited to prevent brute force attacks.
    """
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        logger.warning(
            "Failed login attempt",
            username=form_data.username,
            client_ip=request.client.host if request.client else "unknown"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    logger.info(
        "Successful login",
        user_id=user.id,
        username=user.username
    )
    
    return {
        "access_token": create_access_token(user.id, expires_delta=access_token_expires),
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Get current authenticated user info."""
    return current_user


@router.post("/forgot-password")
def forgot_password(
    data: ForgotPassword,
    db: Session = Depends(get_db)
):
    """
    Generate a password reset token and 'send' it via email.
    """
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        # We return success even if user doesn't exist for security (avoid enumeration)
        logger.info("Password reset requested for non-existent email", email=data.email)
        return {"message": "If an account exists for this email, a reset link has been sent."}
    
    # Create a 30-minute token
    reset_token = create_access_token(user.id, expires_delta=timedelta(minutes=30))
    
    # Send simulated email
    from ...services.email_service import EmailService
    EmailService.send_password_reset_email(data.email, reset_token)
    
    return {"message": "If an account exists for this email, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(
    data: ResetPassword,
    db: Session = Depends(get_db)
):
    """
    Reset password using a valid token.
    """
    from jose import jwt, JWTError
    from ...core.security import get_password_hash
    
    try:
        payload = jwt.decode(data.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=400, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    
    logger.info("Password reset successful", user_id=user.id)
    return {"message": "Password updated successfully"}


