import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
    phone?: string;
    customerName: string;
    orderId: string | number;
    status: string;
    device: string;
    balance: number;
    className?: string;
}

export default function WhatsAppButton({ phone, customerName, orderId, status, device, balance, className }: WhatsAppButtonProps) {
    if (!phone) return null;

    const getMessage = () => {
        const base = `Hola *${customerName}*, te saludamos de *ServiceFlow Pro*. 👋\n\n`;
        const orderInfo = `Referente a tu equipo: *${device}* (Orden #${orderId.toString().padStart(5, '0')}).\n`;
        
        let statusMsg = '';
        switch (status) {
            case 'RECEIVED':
                statusMsg = `Hemos recibido tu equipo correctamente y está en cola para revisión. 🛠️`;
                break;
            case 'IN_PROGRESS':
                statusMsg = `Tu equipo ya está en manos de nuestros técnicos. Te avisaremos pronto. 👨‍🔧`;
                break;
            case 'COMPLETED':
                statusMsg = `¡Buenas noticias! Tu equipo ya está listo para ser retirado. 🎉`;
                break;
            default:
                statusMsg = `El estado de tu equipo es: *${status}*.`;
        }

        const balanceMsg = balance > 0 
            ? `\n\nSaldo pendiente a pagar: *$${balance.toFixed(2)}*.`
            : '\n\nTu equipo no tiene saldos pendientes.';

        const footer = `\n\n¡Gracias por confiar en nosotros! ✨`;

        return encodeURIComponent(base + orderInfo + statusMsg + balanceMsg + footer);
    };

    const handleClick = () => {
        // Remove non-numeric characters from phone
        const cleanPhone = phone.replace(/\D/g, '');
        const url = `https://wa.me/${cleanPhone}?text=${getMessage()}`;
        window.open(url, '_blank');
    };

    return (
        <button 
            onClick={handleClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider group ${className || ''}`}
        >
            <MessageCircle size={14} className="group-hover:scale-110 transition-transform" />
            <span>Notificar WhatsApp</span>
        </button>
    );
}
