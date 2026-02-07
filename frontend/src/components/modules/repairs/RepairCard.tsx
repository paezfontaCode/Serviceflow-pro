import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    User,
    Tag,
    History as HistoryIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Card } from '../../ui/Card';
import { WorkOrder } from '../../../types/repair.types';
import { StatusBadge } from './StatusBadge';
import { repairService } from '../../../services/api/repairService';
import WhatsAppButton from '../../WhatsAppButton';

interface RepairCardProps {
    order: WorkOrder;
    isOverlay?: boolean;
}

export const RepairCard = ({ order, isOverlay }: RepairCardProps) => {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: order.id,
        data: { order }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isUrgent = order.priority === 'URGENT';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`relative group ${isDragging ? 'opacity-50' : ''} ${isOverlay ? 'cursor-grabbing scale-105 rotate-2 shadow-2xl z-50' : 'cursor-grab'}`}
        >
            <Card
                noPadding
                className={`
          p-3 hover:border-primary-500/30 transition-colors
          ${isUrgent ? 'border-rose-500/30 shadow-lg shadow-rose-500/5' : ''}
        `}
            >
                {/* Header: ID and Status */}
                <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-500">#{order.id.toString().padStart(5, '0')}</span>
                        <span className="text-[10px] text-slate-600 font-mono">
                            {format(new Date(order.created_at), 'dd MMM', { locale: es })}
                        </span>
                    </div>
                    <StatusBadge status={order.status} />
                </div>

                {/* Device Info */}
                <div className="flex items-center gap-2 mb-1 min-w-0">
                    <h4 className="font-bold text-slate-200 text-sm truncate">
                        {order.device_model}
                    </h4>
                    {order.is_recurring && (
                        <div
                            className="bg-primary-500/20 text-primary-400 p-0.5 rounded"
                            title="Dispositivo Recurrente"
                        >
                            <HistoryIcon size={10} />
                        </div>
                    )}
                </div>

                {/* Badges/Tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                    {order.is_warranty_active && (
                        <span className="text-[8px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            Garantía
                        </span>
                    )}
                    {order.priority === 'URGENT' && (
                        <span className="text-[8px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            Urgente
                        </span>
                    )}
                </div>

                {/* Customer */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                    <User size={12} />
                    <span className="truncate max-w-[120px] font-medium">{order.customer_name}</span>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-1 mt-auto pt-2 border-t border-white/5 items-center">
                    <WhatsAppButton
                        phone={order.customer_phone || ''}
                        customerName={order.customer_name || ''}
                        device={order.device_model}
                        status={order.status}
                        orderId={order.id}
                        balance={(order.labor_cost_usd || 0) + (order.parts_cost_usd || 0) - (order.paid_amount_usd || 0)}
                        className="px-2 py-1 text-[10px]"
                    />

                    {order.is_recurring && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toast.info(`Equipo registrado anteriormente en Orden #${order.previous_repair_id?.toString().padStart(5, '0')}`);
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-primary-400 transition-colors"
                            title="Historial del Dispositivo"
                        >
                            <HistoryIcon size={14} />
                        </button>
                    )}

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            repairService.getLabel(order.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Imprimir Etiqueta"
                    >
                        <Tag size={14} />
                    </button>
                </div>

                {isUrgent && (
                    <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 animate-pulse m-1" title="Urgente" />
                )}
            </Card>
        </div>
    );
};
