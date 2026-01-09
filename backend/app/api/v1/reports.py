from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ...core.database import get_db
from ...services.report_service import ReportService
from ..deps import get_current_active_user
from datetime import date

router = APIRouter(tags=["reports"])

@router.get("/profit-loss")
def get_profit_loss(
    start_date: date,
    end_date: date,
    currency: str = "USD",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return ReportService.get_profit_loss(db, start_date, end_date, currency)

@router.get("/aging")
def get_aging_report(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return ReportService.get_aging_report(db)

@router.get("/products/{product_id}/kardex")
def get_product_kardex(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return ReportService.get_product_kardex(db, product_id)
