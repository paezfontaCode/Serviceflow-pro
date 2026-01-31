from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Any
from datetime import datetime
import io
import pandas as pd
from ...core.database import get_db
from ..deps import get_current_active_user
from ...models.inventory import Product, Inventory
from ...models.repair import Repair
from ...services.report_service import ReportService
from ...utils.pdf_generator import PDFGenerator
from datetime import date

# ReportLab imports
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

router = APIRouter(tags=["reports"])

def generate_pdf_report(items: List[dict]) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    title_style.alignment = 1 # Center
    
    # Title
    elements.append(Paragraph("Reporte de Reposición de Inventario", title_style))
    elements.append(Paragraph(f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
    elements.append(Spacer(1, 0.2 * inch))
    
    # Table Data
    data = [["Prioridad", "Producto / Nota", "SKU", "Stock", "Mínimo", "Motivo"]]
    
    for item in items:
        # Style Priority
        prio = item["priority"]
        name = item["name"]
        if prio == "URGENT":
           prio_text = "URGENTE"
           name_style = ParagraphStyle('Urgent', parent=styles['Normal'], textColor=colors.red)
           name_cell = Paragraph(name, name_style)
        else:
           prio_text = "BAJA"
           name_cell = Paragraph(name, styles['Normal'])
           
        data.append([
            prio_text,
            name_cell,
            item["sku"],
            str(item["current_stock"]),
            str(item["min_stock"]),
            item["notes"]
        ])
        
    # Table Style
    table = Table(data, colWidths=[0.8*inch, 2.5*inch, 1*inch, 0.7*inch, 0.7*inch, 1.5*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('WORDWRAP', (0, 0), (-1, -1), True)
    ]))
    
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    return buffer

def generate_excel_report(items: List[dict]) -> io.BytesIO:
    # Prepare Data
    df_data = []
    for item in items:
        df_data.append({
            "Prioridad": "URGENTE" if item["priority"] == "URGENT" else "BAJA",
            "Producto": item["name"],
            "SKU": item["sku"],
            "Stock Actual": item["current_stock"],
            "Stock Mínimo": item["min_stock"],
            "Motivo": item["notes"]
        })
        
    df = pd.DataFrame(df_data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Reposición')
        # Adjust column widths could go here if needed
        
    output.seek(0)
    return output

@router.get("/inventory/replenishment-report")
def get_replenishment_report(
    format: str = Query("json", enum=["json", "pdf", "excel"]),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Generate a replenishment report including:
    1. Products with stock < min_stock
    2. ON_HOLD repairs that need specific parts (Missing Part Note)
    """
    
    # 1. Low Stock Products
    low_stock_query = db.query(Product).join(Inventory).filter(
        Inventory.quantity < Inventory.min_stock,
        Product.is_active == True
    ).all()
    
    replenishment_items = []
    
    for product in low_stock_query:
        replenishment_items.append({
            "type": "LOW_STOCK",
            "product_id": product.id,
            "sku": product.sku,
            "name": product.name,
            "current_stock": product.inventory.quantity,
            "min_stock": product.inventory.min_stock if product.inventory else 0,
            "notes": "Stock bajo mínimo",
            "priority": "HIGH"
        })
        
    # 2. Repairs ON_HOLD (Urgent)
    on_hold_repairs = db.query(Repair).filter(
        Repair.status == "on_hold"
    ).all()
    
    for repair in on_hold_repairs:
        if repair.missing_part_note:
            replenishment_items.append({
                "type": "REPAIR_URGENT",
                "product_id": None,
                "sku": f"REP-{repair.id}",
                "name": repair.missing_part_note,
                "current_stock": 0,
                "min_stock": 1,
                "notes": f"URGENTE: Cliente Esperando (Orden #{repair.id})",
                "priority": "URGENT"
            })
            
    # Sort: URGENT first
    replenishment_items.sort(key=lambda x: 0 if x["priority"] == "URGENT" else 1)
    
    if format == "json":
        return replenishment_items
        
    elif format == "pdf":
        pdf_buffer = generate_pdf_report(replenishment_items)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=reporte_reposicion.pdf"}
        )
        
    elif format == "excel":
        excel_buffer = generate_excel_report(replenishment_items)
        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=reporte_reposicion.xlsx"}
        )

@router.get("/profit-loss")
def get_profit_loss(
    start_date: date,
    end_date: date,
    format: str = "json",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    data = ReportService.get_profit_loss(db, start_date, end_date)
    
    if format == "json":
        return data
        
    elif format == "pdf":
        pdf = PDFGenerator(filename_prefix="pyg")
        elements = pdf.create_standard_header(db, "ESTADO DE RESULTADOS (P&G)")
        
        elements.append(Paragraph(f"Periodo: {start_date} al {end_date}", pdf.styles['Normal']))
        elements.append(Spacer(1, 0.2 * inch))
        
        table_data = [
            ["DESCRIPCIÓN", "MONTO (USD)"],
            ["INGRESOS POR VENTAS", f"${data['revenue']}"],
            ["COSTO DE VENTAS (COGS)", f"${data['cogs']}"],
            ["UTILIDAD BRUTA", f"${data['gross_profit']}"],
            ["GASTOS OPERATIVOS", f"${data['expenses']}"],
            ["UTILIDAD NETA", f"${data['net_profit']}"]
        ]
        
        t = Table(table_data, colWidths=[4*inch, 2*inch])
        t.setStyle(pdf.get_table_style())
        elements.append(t)
        
        buffer = pdf.generate_streaming_response(elements)
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={pdf.filename}"}
        )

@router.get("/aging")
def get_aging_report(
    format: str = "json",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    data = ReportService.get_aging_report(db)
    
    if format == "json":
        return data
        
    elif format == "pdf":
        pdf = PDFGenerator(filename_prefix="cuentas_por_cobrar")
        elements = pdf.create_standard_header(db, "REPORTE DE CUENTAS POR COBRAR (ANTIGÜEDAD)")
        
        table_data = [["RANGO DÍAS", "MONTO PENDIENTE (USD)"]]
        for bucket, amount in data.items():
            table_data.append([bucket, f"${amount}"])
            
        t = Table(table_data, colWidths=[3*inch, 3*inch])
        t.setStyle(pdf.get_table_style())
        elements.append(t)
        
        buffer = pdf.generate_streaming_response(elements)
        return StreamingResponse(buffer, media_type="application/pdf")

@router.get("/kardex/{product_id}")
def get_product_kardex(
    product_id: int,
    format: str = "json",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    data = ReportService.get_product_kardex(db, product_id)
    
    if format == "json":
        return data
        
    elif format == "pdf":
        pdf = PDFGenerator(filename_prefix=f"kardex_{product_id}")
        elements = pdf.create_standard_header(db, f"KARDEX DE INVENTARIO: {product.name}")
        
        table_data = [["Fecha", "Tipo", "Referencia", "Cant.", "Usuario"]]
        for log in data:
            table_data.append([
                log["date"].strftime("%d/%m/%Y"),
                log["type"],
                (log["reference"][:25] if log["reference"] else "N/A"),
                str(log["change"]),
                log["user"]
            ])
            
        t = Table(table_data, colWidths=[1.2*inch, 1*inch, 2*inch, 0.8*inch, 1.5*inch])
        t.setStyle(pdf.get_table_style())
        elements.append(t)
        
        buffer = pdf.generate_streaming_response(elements)
        return StreamingResponse(buffer, media_type="application/pdf")
