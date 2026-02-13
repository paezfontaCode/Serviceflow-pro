from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...core.security import get_password_hash
from ...models.user import User, Role
from ...schemas.user import UserCreate, UserRead, RoleRead, UserUpdate
from ..deps import get_current_active_user

router = APIRouter(tags=["users"])

@router.get("/", response_model=List[UserRead])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all users (Admin only recommended)"""
    # For now any active user can list, but we should restrict
    return db.query(User).offset(skip).limit(limit).all()

@router.post("/", response_model=UserRead)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new user"""
    db_user = db.query(User).filter(User.username == user_in.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        is_active=user_in.is_active
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    user_in: UserUpdate, # Or a UserUpdate schema
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-deletion of the current user
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
    db.delete(db_user)
    db.commit()
    return None

@router.get("/roles", response_model=List[RoleRead])
def read_roles(db: Session = Depends(get_db)):
    return db.query(Role).all()

@router.post("/{user_id}/roles/{role_id}")
def assign_role(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    role = db.query(Role).filter(Role.id == role_id).first()
    if not user or not role:
        raise HTTPException(status_code=404, detail="User or Role not found")
    
    if role not in user.roles:
        user.roles.append(role)
        db.commit()
    return {"message": "Role assigned successfully"}

@router.delete("/{user_id}/roles/{role_id}")
def remove_role(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    role = db.query(Role).filter(Role.id == role_id).first()
    if not user or not role:
        raise HTTPException(status_code=404, detail="User or Role not found")
    
    if role in user.roles:
        user.roles.remove(role)
        db.commit()
    return {"message": "Role removed successfully"}
