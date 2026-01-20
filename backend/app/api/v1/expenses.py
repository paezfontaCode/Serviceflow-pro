from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...schemas.finance import ExpenseCreate, ExpenseRead, ExpenseCategoryCreate, ExpenseCategoryRead
from ...services.expense_service import ExpenseService
from ..deps import get_current_active_user
from ...models.user import User

router = APIRouter()

@router.post("/categories", response_model=ExpenseCategoryRead)
def create_category(
    category: ExpenseCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return ExpenseService.create_category(db, category)

@router.get("/categories", response_model=List[ExpenseCategoryRead])
def get_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return ExpenseService.get_categories(db, skip, limit)

@router.post("/", response_model=ExpenseRead)
def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return ExpenseService.create_expense(db, expense, current_user.id)

@router.get("/", response_model=List[ExpenseRead])
def get_expenses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return ExpenseService.get_expenses(db, skip, limit)

@router.get("/monthly/{year}/{month}", response_model=List[ExpenseRead])
def get_monthly_expenses(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return ExpenseService.get_monthly_expenses(db, year, month)
