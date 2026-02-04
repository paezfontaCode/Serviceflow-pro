import requests
import logging
from sqlalchemy.orm import Session
from ..models.settings import SystemSetting

logger = logging.getLogger(__name__)

class WhatsAppService:
    @staticmethod
    def _get_settings(db: Session):
        return db.query(SystemSetting).filter(SystemSetting.is_active == True).first()

    @staticmethod
    def send_notification(db: Session, phone: str, message: str) -> bool:
        """
        Sends a simple text message via WhatsApp API configured in settings.
        Expects phone in 584121234567 format.
        """
        if not phone:
            logger.error("WhatsApp: No phone number provided")
            return False

        settings = WhatsAppService._get_settings(db)
        if not settings or not settings.whatsapp_api_url or not settings.whatsapp_token:
            logger.error("WhatsApp: API not configured in settings")
            return False

        # Normalize phone (remove +)
        clean_phone = phone.replace('+', '').replace(' ', '')

        try:
            # This is a generic implementation. Depending on the provider (Meta, Twilio, UltraMsg, etc.)
            # the payload structure might vary. We'll use a standard JSON POST approach.
            payload = {
                "to": clean_phone,
                "message": message,
                "token": settings.whatsapp_token # Some providers use token in body
            }
            
            headers = {
                "Authorization": f"Bearer {settings.whatsapp_token}",
                "Content-Type": "application/json"
            }

            response = requests.post(
                settings.whatsapp_api_url,
                json=payload,
                headers=headers,
                timeout=10
            )

            if response.status_code in [200, 201]:
                logger.info(f"WhatsApp message sent to {clean_phone}")
                return True
            else:
                logger.error(f"WhatsApp API error: {response.text}")
                return False

        except Exception as e:
            logger.error(f"WhatsApp exception: {str(e)}")
            return False

    @staticmethod
    def send_ticket_notification(db: Session, phone: str, customer_name: str, amount: float, reference: str):
        """Pre-formatted message for sales tickets."""
        company_name = WhatsAppService._get_settings(db).company_name or "ServiceFlow Pro"
        message = (
            f"Hola {customer_name}! 📄\n\n"
            f"Gracias por preferir *{company_name}*.\n"
            f"Tu comprobante de pago *#{reference}* por un monto de *${amount:.2f}* ha sido generado con éxito.\n\n"
            f"¡Feliz día! ✨"
        )
        return WhatsAppService.send_notification(db, phone, message)

    @staticmethod
    def send_repair_status_notification(db: Session, phone: str, customer_name: str, device: str, status: str, repair_id: int):
        """Pre-formatted message for repair updates."""
        company_name = WhatsAppService._get_settings(db).company_name or "ServiceFlow Pro"
        status_map = {
            "RECEIVED": "Recibido 📥",
            "IN_PROGRESS": "En Reparación 🛠️",
            "ON_HOLD": "En Espera ⏳",
            "COMPLETED": "Listo para Retirar ✅",
            "DELIVERED": "Entregado 📦",
            "CANCELLED": "Cancelado ❌"
        }
        
        status_friendly = status_map.get(status.upper(), status)
        
        message = (
            f"Hola {customer_name}! 👋\n\n"
            f"Te informamos que tu equipo *{device}* (ID: {repair_id}) se encuentra en estado: *{status_friendly}* en *{company_name}*.\n\n"
            f"Te avisaremos ante cualquier novedad. ¡Muchas gracias!"
        )
        return WhatsAppService.send_notification(db, phone, message)
