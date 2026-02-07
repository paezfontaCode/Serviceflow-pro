import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '@/services/api/inventoryService';
import { repairService } from '@/services/api/repairService';
import { financeService } from '@/services/api/financeService';
import { AlertTriangle, Clock, TrendingDown, CheckCircle2, ArrowRight } from 'lucide-react';
import { ProductRead, PaginatedResponse } from '@/types/api';
import { WorkOrderRead } from '@/services/api/repairService';

export default function ActionAlerts() {
    const navigate = useNavigate();

    const { data: paginationProducts } = useQuery<PaginatedResponse<ProductRead>>({
        queryKey: ['products'],
        queryFn: () => inventoryService.getProducts(1, 100),
    });

    const products = paginationProducts?.items || [];

    const { data: paginationRepairs } = useQuery<PaginatedResponse<WorkOrderRead>>({
        queryKey: ['repairs'],
        queryFn: () => repairService.getWorkOrders(1, 100),
    });

    const repairs = paginationRepairs?.items || [];

    const { data: finance } = useQuery({
        queryKey: ['financeSummary'],
        queryFn: financeService.getSummary,
    });

    // Alert Logic
    const lowStockCount = products?.filter((p: ProductRead) => p.inventory_quantity <= 5)?.length || 0; // Assuming 5 is critical/min threshold logic for MVP

    const overdueRepairs = repairs?.filter((r: WorkOrderRead) => {
        const isPending = r.status !== 'DELIVERED' && r.status !== 'READY';
        const createdAt = new Date(r.created_at);
        const hoursAgo = (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return isPending && hoursAgo > 48; // Older than 48h
    }) || [];

    const readyRepairs = repairs?.filter((r: WorkOrderRead) => r.status === 'READY')?.length || 0;

    const debtorsCount = finance?.morosos_count || 0;

    // Do not render if no alerts? Or always render grid? 
    // Plan says "Executive view with actionable alerts". Always rendering gives confidence everything is OK.

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Low Stock Alert */}
            <div
                onClick={() => navigate('/inventory')}
                className={`glass-card p-4 border border-white/5 relative group cursor-pointer hover:border-red-500/30 transition-all ${lowStockCount > 0 ? 'bg-red-500/5' : ''}`}
            >
                <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-lg ${lowStockCount > 0 ? 'bg-red-500/10 text-red-500' : 'bg-slate-800 text-slate-500'}`}>
                        <TrendingDown size={20} />
                    </div>
                    {lowStockCount > 0 && <span className="animate-pulse w-2 h-2 rounded-full bg-red-500"></span>}
                </div>
                <div className="mt-3">
                    <p className="text-2xl font-black text-white">{lowStockCount}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stock Crítico</p>
                </div>
                <div className="mt-2 text-xs text-slate-400 group-hover:text-white transition-colors flex items-center gap-1">
                    Ver Inventario <ArrowRight size={12} />
                </div>
            </div>

            {/* Overdue Repairs */}
            <div
                onClick={() => navigate('/repairs')}
                className={`glass-card p-4 border border-white/5 relative group cursor-pointer hover:border-orange-500/30 transition-all ${overdueRepairs.length > 0 ? 'bg-orange-500/5' : ''}`}
            >
                <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-lg ${overdueRepairs.length > 0 ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-800 text-slate-500'}`}>
                        <Clock size={20} />
                    </div>
                    {overdueRepairs.length > 0 && <span className="animate-pulse w-2 h-2 rounded-full bg-orange-500"></span>}
                </div>
                <div className="mt-3">
                    <p className="text-2xl font-black text-white">{overdueRepairs.length}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reparaciones +48h</p>
                </div>
                <div className="mt-2 text-xs text-slate-400 group-hover:text-white transition-colors flex items-center gap-1">
                    Ver Tablero <ArrowRight size={12} />
                </div>
            </div>

            {/* Debtors */}
            <div
                onClick={() => navigate('/finance')}
                className={`glass-card p-4 border border-white/5 relative group cursor-pointer hover:border-amber-500/30 transition-all ${debtorsCount > 0 ? 'bg-amber-500/5' : ''}`}
            >
                <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-lg ${debtorsCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-500'}`}>
                        <AlertTriangle size={20} />
                    </div>
                </div>
                <div className="mt-3">
                    <p className="text-2xl font-black text-white">{debtorsCount}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cuentas por Cobrar</p>
                </div>
                <div className="mt-2 text-xs text-slate-400 group-hover:text-white transition-colors flex items-center gap-1">
                    Gestión de Cobro <ArrowRight size={12} />
                </div>
            </div>

            {/* Ready to Deliver */}
            <div
                onClick={() => navigate('/repairs')}
                className={`glass-card p-4 border border-white/5 relative group cursor-pointer hover:border-emerald-500/30 transition-all ${readyRepairs > 0 ? 'bg-emerald-500/5' : ''}`}
            >
                <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-lg ${readyRepairs > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                        <CheckCircle2 size={20} />
                    </div>
                    {readyRepairs > 0 && <span className="animate-pulse w-2 h-2 rounded-full bg-emerald-500"></span>}
                </div>
                <div className="mt-3">
                    <p className="text-2xl font-black text-white">{readyRepairs}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Equipos Listos</p>
                </div>
                <div className="mt-2 text-xs text-slate-400 group-hover:text-white transition-colors flex items-center gap-1">
                    Notificar Clientes <ArrowRight size={12} />
                </div>
            </div>
        </div>
    );
}
