"""
Standardized PDF Generation Utility for Serviceflow Pro using ReportLab.
Handles headers, footers, and common table styles for all reports.
"""
import io
from datetime import datetime, timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from ..models.settings import SystemSetting
from sqlalchemy.orm import Session

class PDFGenerator:
    def __init__(self, filename_prefix: str = "report"):
        self.styles = getSampleStyleSheet()
        self.filename = f"{filename_prefix}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.pdf"
        
        # Custom Styles
        self.header_style = ParagraphStyle(
            'Header',
            parent=self.styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor("#1a365d"),
            spaceAfter=5
        )
        self.subheader_style = ParagraphStyle(
            'SubHeader',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.grey,
            spaceAfter=12
        )

    def _get_company_info(self, db: Session):
        """Fetch company settings from database."""
        settings = db.query(SystemSetting).filter(SystemSetting.is_active == True).first()
        if not settings:
            return {
                "name": "Serviceflow Pro",
                "tax_id": "N/A",
                "address": "",
                "phone": "",
                "email": ""
            }
        return {
            "name": settings.company_name,
            "tax_id": settings.company_tax_id,
            "address": settings.company_address,
            "phone": settings.company_phone,
            "email": settings.company_email
        }

    def create_standard_header(self, db: Session, title: str):
        """Creates a professional document header with company info."""
        info = self._get_company_info(db)
        elements = []
        
        # Title and Company Name
        elements.append(Paragraph(title.upper(), self.header_style))
        elements.append(Paragraph(info["name"], self.styles["Heading2"]))
        
        # Sub-info row
        company_details = f"RIF: {info['tax_id']} | Tel: {info['phone']} | {info['email']}"
        elements.append(Paragraph(company_details, self.subheader_style))
        
        if info["address"]:
            elements.append(Paragraph(f"Dirección: {info['address']}", self.styles["Normal"]))
            
        elements.append(Spacer(1, 0.2 * inch))
        elements.append(Paragraph(f"Fecha de Generación: {datetime.now(timezone.utc).strftime('%d/%m/%Y %H:%M')}", self.styles["Normal"]))
        elements.append(Spacer(1, 0.3 * inch))
        
        return elements

    def get_table_style(self):
        """Standard styling for report tables."""
        return TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#2d3748")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.white])
        ])

    def generate_streaming_response(self, elements: list):
        """Builds PDF and returns a seeked BytesIO buffer."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=letter,
            rightMargin=50, leftMargin=50,
            topMargin=50, bottomMargin=50
        )
        doc.build(elements)
        buffer.seek(0)
        return buffer
