import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Search, Wrench, ArrowRight, Loader2 } from 'lucide-react';
import { repairService } from '@/services/api/repairService';
import { useCartStore } from '@/store/cartStore';
import { formatUSD } from '@/utils/currency';

interface ReadyOrdersModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ReadyOrdersModal({ isOpen, onClose }: ReadyOrdersModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const addRepairItem = useCartStore((state) => state.addRepairItem);
    const cartItems = useCartStore((state) => state.items);

    const { data: repairs, isLoading } = useQuery({
        queryKey: ['workOrders'],
        queryFn: async () => {
            const response = await repairService.getWorkOrders(1, 100);
            // Filter: teams in COMPLETED or READY state with pending balance.
            return response.items.filter(r => {
                const status = r.status.toLowerCase();
                const isReady = status === 'completed' || status === 'ready' || status === 'listo';
                const hasBalance = (Number(r.labor_cost_usd || 0) + Number(r.parts_cost_usd || 0) - Number(r.paid_amount_usd || 0)) > 0;
                return isReady && hasBalance;
            });
        },
        enabled: isOpen
    });

    const filteredRepairs = repairs?.filter(r => {
        const search = searchTerm.toLowerCase();
        return (
            r.customer_name?.toLowerCase().includes(search) ||
            r.device_model?.toLowerCase().includes(search) ||
            r.id.toString().includes(search)
        );
    });

    const handleSelect = (repair: any) => {
        const remaining = Number(repair.labor_cost_usd || 0) + Number(repair.parts_cost_usd || 0) - Number(repair.paid_amount_usd || 0);

        addRepairItem({
            id: repair.id,
            customer_id: repair.customer_id,
            customer_name: repair.customer_name || 'Cliente',
            brand: '', // backend has device_model
            model: repair.device_model,
            remaining_balance: remaining,
            description: repair.problem_description || '',
            created_at: repair.created_at
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative glass-card w-full max-w-2xl overflow-hidden border-white/10 animate-fade-in-up flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-finance/10 text-finance">
                            <Wrench size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Cargar Orden Lista</h2>
                            <p className="text-xs text-slate-400">Seleccione un equipo para procesar el pago final</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 border-b border-white/5">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-finance" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, modelo o # orden..."
                            className="input-field pl-12 h-12 w-full border-white/5 bg-white/5 focus:border-finance/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="h-40 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-finance animate-spin" />
                        </div>
                    ) : filteredRepairs?.length === 0 ? (
                        <div className="h-40 flex flex-col items-center justify-center text-slate-500 gap-2">
                            <p>No se encontraron órdenes completadas</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredRepairs?.map(repair => {
                                const remaining = Number(repair.labor_cost_usd || 0) + Number(repair.parts_cost_usd || 0) - Number(repair.paid_amount_usd || 0);
                                const isAlreadyInCart = cartItems.some(item => item.type === 'repair' && item.repair.id === repair.id);

                                return (
                                    <button
                                        key={repair.id}
                                        onClick={() => !isAlreadyInCart && handleSelect(repair)}
                                        disabled={isAlreadyInCart}
                                        className={`w-full p-4 flex items-center justify-between rounded-xl border transition-all text-left ${isAlreadyInCart
                                                ? 'opacity-50 cursor-not-allowed bg-white/2 border-white/5'
                                                : 'hover:bg-white/5 border-white/5 hover:border-finance/30 group'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-finance/10 flex items-center justify-center text-finance">
                                                <span className="text-sm font-black">#{repair.id}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white group-hover:text-finance transition-colors">{repair.customer_name}</h4>
                                                <p className="text-xs text-slate-400 capitalize">{repair.device_model}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-500 uppercase">Saldo Pendiente</p>
                                                <p className="text-lg font-black text-finance">{formatUSD(remaining)}</p>
                                            </div>
                                            <ArrowRight size={20} className={`text-slate-600 ${!isAlreadyInCart && 'group-hover:translate-x-1 group-hover:text-finance'} transition-all`} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-black/20 text-center border-t border-white/5">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        Solo se muestran equipos en estado "COMPLETED" con saldo deudor
                    </p>
                </div>
            </div>
        </div>
    );
}
