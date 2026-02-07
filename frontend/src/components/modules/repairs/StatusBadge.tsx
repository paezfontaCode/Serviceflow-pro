import { RepairStatus } from '../../../types/repair.types';

const STATUS_CONFIG: Record<RepairStatus, { label: string; className: string }> = {
    RECEIVED: {
        label: 'Recibido',
        className: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    },
    IN_PROGRESS: {
        label: 'En Revisión',
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
    },
    ON_HOLD: {
        label: 'En Espera',
        className: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    },
    READY: {
        label: 'Listo',
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-glow-sm shadow-emerald-500/20'
    },
    DELIVERED: {
        label: 'Entregado',
        className: 'bg-slate-600/10 text-slate-400 border-slate-600/20'
    },
    CANCELLED: {
        label: 'Cancelado',
        className: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    }
};

interface StatusBadgeProps {
    status: RepairStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.RECEIVED;

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${config.className}`}>
            {config.label}
        </span>
    );
};
