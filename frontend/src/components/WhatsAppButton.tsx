import { useState } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { repairService } from '@/services/api/repairService';
import { salesService } from '@/services/api/salesService';
import { toast } from 'sonner';

interface WhatsAppButtonProps {
    phone?: string;
    customerName: string;
    orderId: string | number;
    status: string;
    device: string;
    balance: number;
    className?: string;
    mode?: 'direct' | 'link';
    type?: 'repair' | 'sale';
}

export default function WhatsAppButton({
    phone,
    customerName,
    orderId,
    status,
    device,
    balance,
    className,
    mode = 'link',
    type = 'repair'
}: WhatsAppButtonProps) {
    const [loading, setLoading] = useState(false);

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
            case 'DELIVERED':
                statusMsg = `Tu equipo ha sido entregado. ¡Gracias por preferirnos! ✅`;
                break;
            default:
                statusMsg = `El estado de tu equipo es: *${status}*.`;
        }

        const balanceMsg = balance > 0
            ? `\n\nSaldo pendiente a pagar: *$${balance.toFixed(2)}*.`
            : '\n\nTu equipo no tiene saldos pendientes.';

        const footer = `\n\n¡Gracias por confiar en nosotros! ✨`;

        return base + orderInfo + statusMsg + balanceMsg + footer;
    };

    const handleClick = async () => {
        if (mode === 'link') {
            const cleanPhone = phone.replace(/\D/g, '');
            const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(getMessage())}`;
            window.open(url, '_blank');
            return;
        }

        // Direct Mode (API)
        setLoading(true);
        const toastId = toast.loading('Enviando WhatsApp directo...');
        try {
            if (type === 'repair') {
                await repairService.sendWhatsApp(Number(orderId));
            } else {
                await salesService.sendWhatsApp(Number(orderId));
            }
            toast.success('WhatsApp enviado correctamente', { id: toastId });
        } catch (error: any) {
            console.error('WhatsApp direct error:', error);
            const detail = error.response?.data?.detail || 'Error al conectar con la API';
            toast.error(`No se pudo enviar: ${detail}`, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider group disabled:opacity-50 ${className || ''}`}
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} className="group-hover:scale-110 transition-transform" />}
            <span>{mode === 'direct' ? 'WhatsApp Directo' : 'Notificar WhatsApp'}</span>
        </button>
    );
}
