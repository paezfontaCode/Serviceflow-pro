import { useState } from 'react';
import {
    Plus,
    Search,
    Filter,
    Package,
    X
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseService } from '@/services/api/purchaseService';
import { formatUSD } from '@/utils/currency';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { SupplierRead, PurchaseOrderRead } from '@/types/api';
import Pagination from '@/components/Pagination';
import SupplierForm from './components/SupplierForm';
import PurchaseOrderForm from './components/PurchaseOrderForm';

type Tab = 'orders' | 'suppliers';

export default function Purchases() {
    const [activeTab, setActiveTab] = useState<Tab>('orders');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierRead | null>(null);
    const queryClient = useQueryClient();

    const { data: purchases, isLoading: loadingPurchases } = useQuery({
        queryKey: ['purchases', page, searchTerm],
        queryFn: () => purchaseService.getPurchases({ page, size: 10, search: searchTerm }),
        enabled: activeTab === 'orders'
    });

    const { data: suppliersPagination, isLoading: loadingSuppliers } = useQuery({
        queryKey: ['suppliers', page, searchTerm],
        queryFn: () => purchaseService.getSuppliers({ page, size: 10, search: searchTerm }),
        enabled: activeTab === 'suppliers'
    });

    const suppliers = suppliersPagination?.items || [];

    const receiveMutation = useMutation({
        mutationFn: (id: number) => purchaseService.receivePurchase(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            toast.success('Orden recibida. Stock actualizado.');
        }
    });

    const cancelMutation = useMutation({
        mutationFn: (id: number) => purchaseService.cancelPurchase(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            toast.success('Orden cancelada');
        }
    });

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        setPage(1);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white tracking-tight">Módulo de Compras</h2>
                    <p className="text-slate-500 text-sm font-medium">Gestión de abastecimiento y proveedores</p>
                </div>

                <button
                    onClick={() => activeTab === 'orders' ? setIsOrderModalOpen(true) : setIsSupplierModalOpen(true)}
                    className="btn-primary h-12 px-8 flex items-center gap-2 group"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    <span>{activeTab === 'orders' ? 'Nueva Orden' : 'Nuevo Proveedor'}</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit border border-white/5">
                <button
                    onClick={() => handleTabChange('orders')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'orders'
                            ? 'bg-primary-500 text-white shadow-glow'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    Órdenes de Compra
                </button>
                <button
                    onClick={() => handleTabChange('suppliers')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'suppliers'
                            ? 'bg-primary-500 text-white shadow-glow'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    Proveedores
                </button>
            </div>

            {/* Main Content */}
            <div className="glass-card border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder={activeTab === 'orders' ? "Buscar por proveedor o ID..." : "Buscar proveedor..."}
                            className="input-field pl-12 h-12"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {activeTab === 'orders' ? (
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-white/5 bg-white/[0.02]">
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">ID / Fecha</th>
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Proveedor</th>
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</th>
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Total</th>
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loadingPurchases ? (
                                    <tr><td colSpan={5} className="p-10 text-center text-slate-500 ring-animate">Cargando órdenes...</td></tr>
                                ) : (purchases?.items || []).length === 0 ? (
                                    <tr><td colSpan={5} className="p-20 text-center text-slate-600 font-bold uppercase tracking-widest text-xs">No hay órdenes registradas</td></tr>
                                ) : (purchases?.items || []).map((order: PurchaseOrderRead) => (
                                    <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="p-6 text-center">
                                            <p className="text-sm font-bold text-white">#{order.id}</p>
                                            <p className="text-[10px] text-slate-500">{format(new Date(order.created_at), 'dd/MM/yy')}</p>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-sm font-bold text-white">{order.supplier_name}</p>
                                            <p className="text-[10px] text-slate-500">Por: {order.username}</p>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${order.status === 'received' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                    order.status === 'cancelled' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                                        order.status === 'ordered' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                            'bg-white/5 text-slate-500'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right font-bold text-white">
                                            {formatUSD(order.total_amount_usd)}
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="flex justify-center gap-2">
                                                {order.status === 'ordered' && (
                                                    <>
                                                        <button
                                                            onClick={() => receiveMutation.mutate(order.id)}
                                                            className="p-2 hover:bg-emerald-500/10 rounded-lg text-emerald-500 transition-colors"
                                                            title="Recibir Pedido"
                                                        >
                                                            <Package size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => cancelMutation.mutate(order.id)}
                                                            className="p-2 hover:bg-rose-500/10 rounded-lg text-rose-500 transition-colors"
                                                            title="Cancelar Pedido"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-primary-400 transition-colors">
                                                    <Filter size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-white/5 bg-white/[0.02]">
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre / Empresa</th>
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Contacto</th>
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">RIF / Tax ID</th>
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Estado</th>
                                    <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loadingSuppliers ? (
                                    <tr><td colSpan={5} className="p-10 text-center text-slate-500">Cargando proveedores...</td></tr>
                                ) : (suppliers || []).length === 0 ? (
                                    <tr><td colSpan={5} className="p-20 text-center text-slate-600 font-bold uppercase tracking-widest text-xs">No hay proveedores registrados</td></tr>
                                ) : (suppliers || []).map((supplier: SupplierRead) => (
                                    <tr key={supplier.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="p-6">
                                            <p className="text-sm font-bold text-white">{supplier.name}</p>
                                            <p className="text-[10px] text-slate-500">{supplier.email}</p>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-sm font-medium text-slate-300">{supplier.contact_name}</p>
                                            <p className="text-[10px] text-slate-500">{supplier.phone}</p>
                                        </td>
                                        <td className="p-6 text-center text-xs font-mono text-slate-400">
                                            {supplier.tax_id || '-'}
                                        </td>
                                        <td className="p-6 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${supplier.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                                }`}>
                                                {supplier.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-center">
                                            <button
                                                onClick={() => {
                                                    setSelectedSupplier(supplier);
                                                    setIsSupplierModalOpen(true);
                                                }}
                                                className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-primary-400 transition-colors"
                                            >
                                                <Filter size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <Pagination
                    currentPage={page}
                    totalPages={activeTab === 'orders' ? (purchases?.pages || 0) : (suppliersPagination?.pages || 0)}
                    totalItems={activeTab === 'orders' ? (purchases?.total || 0) : (suppliersPagination?.total || 0)}
                    itemsOnPage={activeTab === 'orders' ? (purchases?.items?.length || 0) : (suppliers?.length || 0)}
                    onPageChange={setPage}
                />
            </div>

            {isSupplierModalOpen && (
                <SupplierForm
                    supplier={selectedSupplier}
                    onClose={() => {
                        setIsSupplierModalOpen(false);
                        setSelectedSupplier(null);
                    }}
                />
            )}

            {isOrderModalOpen && (
                <PurchaseOrderForm
                    onClose={() => setIsOrderModalOpen(false)}
                />
            )}
        </div>
    );
}
