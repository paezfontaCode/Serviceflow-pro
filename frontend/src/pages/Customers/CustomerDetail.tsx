import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ChevronLeft, Phone, Mail, MapPin,
    DollarSign, Wrench, ShoppingCart,
    Calendar, Tag, MoreVertical, CreditCard, Smartphone, History,
    ArrowUpRight,
    Download,
    FileText,
    FileSpreadsheet
} from 'lucide-react';
import { customerService } from '@/services/api/customerService';
import { formatUSD } from '@/utils/currency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

export default function CustomerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const customerId = parseInt(id || '0');
    const [activeTab, setActiveTab] = useState<'timeline' | 'devices' | 'account'>('timeline');

    const { data: profile, isLoading } = useQuery({
        queryKey: ['customerProfile', customerId],
        queryFn: () => customerService.getCustomerProfile(customerId),
        enabled: !!customerId
    });

    if (isLoading) {
        return (
            <div className="h-[600px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/customers')}
                        className="p-2 rounded-xl glass border-white/5 text-slate-400 hover:text-white transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-slate-400 font-bold text-2xl shadow-lg">
                            {profile.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-black text-white tracking-tight">{profile.name}</h2>
                                {Number(profile.current_debt) > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-wider">
                                        Moroso
                                    </span>
                                )}
                                {profile.loyalty_points && profile.loyalty_points > 100 && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-wider">
                                        VIP
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                <span className="flex items-center gap-1"><Tag size={12} />{profile.dni_type}-{profile.dni}</span>
                                <span className="flex items-center gap-1"><Phone size={12} />{profile.phone || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => customerService.exportHistory(customerId, 'pdf')}
                        className="px-4 py-2.5 flex items-center gap-2 glass hover:bg-white/5 text-slate-400 hover:text-white transition-all rounded-xl border border-white/5 font-bold text-xs"
                        title="Exportar PDF"
                    >
                        <FileText size={18} />
                        <span className="hidden md:inline">PDF</span>
                    </button>
                    <button
                        onClick={() => customerService.exportHistory(customerId, 'excel')}
                        className="px-4 py-2.5 flex items-center gap-2 glass hover:bg-white/5 text-slate-400 hover:text-white transition-all rounded-xl border border-white/5 font-bold text-xs"
                        title="Exportar Excel"
                    >
                        <FileSpreadsheet size={18} />
                        <span className="hidden md:inline">Excel</span>
                    </button>
                    <button className="btn-primary px-6 py-2.5 text-sm">
                        Nueva Reparación
                    </button>
                    <button className="glass px-4 py-2.5 rounded-xl border-white/5 hover:bg-white/5 transition-all text-slate-400 hover:text-white">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content (Left Column) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="glass-card p-6 border-white/5 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <DollarSign size={60} />
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Saldo Pendiente</p>
                            <p className={`text-2xl font-black ${Number(profile.current_debt) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {formatUSD(Number(profile.current_debt || 0))}
                            </p>
                        </div>
                        <div className="glass-card p-6 border-white/5 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <CreditCard size={60} />
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Gastado</p>
                            <p className="text-2xl font-black text-amber-400">
                                {formatUSD(Number(profile.total_spent || 0))}
                            </p>
                        </div>
                        <div className="glass-card p-6 border-white/5 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Wrench size={60} />
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Reparaciones Activas</p>
                            <p className="text-2xl font-black text-primary-400">
                                {profile.active_repairs.length}
                            </p>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex border-b border-white/5">
                        <button
                            onClick={() => setActiveTab('timeline')}
                            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'timeline' ? 'border-primary-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                        >
                            Historial
                        </button>
                        <button
                            onClick={() => setActiveTab('devices')}
                            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'devices' ? 'border-primary-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                        >
                            Equipos
                        </button>
                        <button
                            onClick={() => setActiveTab('account')}
                            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'account' ? 'border-primary-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                        >
                            Cuenta Corriente
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[300px]">
                        {activeTab === 'timeline' && (
                            <div className="space-y-4">
                                {profile.recent_sales.length === 0 && profile.repair_history.length === 0 && profile.active_repairs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                        <History size={48} className="mb-4 opacity-50" />
                                        <p>No hay actividad reciente</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Active Repairs First */}
                                        {profile.active_repairs.map(repair => (
                                            <div key={`active-${repair.id}`} className="glass-card p-4 border-l-4 border-l-primary-500 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-primary-500/10 rounded-lg text-primary-400">
                                                        <Wrench size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">Reparación en Progreso</p>
                                                        <p className="text-xs text-slate-500">{repair.device_model} - {repair.problem_description}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-black uppercase px-2 py-1 bg-white/5 rounded text-slate-300">
                                                    {repair.status}
                                                </span>
                                            </div>
                                        ))}

                                        {/* Completed History (Sales + Repairs) */}
                                        {profile.repair_history.map(repair => (
                                            <div key={`history-${repair.id}`} className="glass-card p-4 flex items-center justify-between group hover:bg-white/5 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-slate-700/50 rounded-lg text-slate-400 group-hover:text-white transition-colors">
                                                        <Wrench size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white uppercase tracking-tight">{repair.device_model}</p>
                                                        <p className="text-xs text-slate-500">Reparación Finalizada • {format(new Date(repair.created_at), "dd MMM", { locale: es })}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{repair.status}</p>
                                                    <button
                                                        onClick={() => navigate('/repairs')}
                                                        className="p-2 rounded-lg bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                                                    >
                                                        <ArrowUpRight size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {profile.recent_sales.map(sale => (
                                            <div key={`sale-${sale.id}`} className="glass-card p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                                        <ShoppingCart size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">Compra #{sale.id}</p>
                                                        <p className="text-xs text-slate-500">{format(new Date(sale.created_at), "dd MMM yyyy, HH:mm", { locale: es })}</p>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-white">{formatUSD(Number(sale.total_usd))}</p>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'devices' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Deduplicate devices based on model/brand approx */}
                                {Array.from(new Set(profile.repair_history.concat(profile.active_repairs).map(r => r.device_model))).map((model, idx) => (
                                    <div key={idx} className="glass-card p-4 flex items-center gap-4">
                                        <div className="p-3 bg-white/5 rounded-xl text-slate-400">
                                            <Smartphone size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{model}</p>
                                            <p className="text-xs text-slate-500">Historial de servicio</p>
                                        </div>
                                    </div>
                                ))}
                                {profile.repair_history.length === 0 && profile.active_repairs.length === 0 && (
                                    <p className="text-slate-500 text-sm col-span-2 text-center py-8">No hay dispositivos registrados.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'account' && (
                            <div className="glass-card overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Fecha</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Descripción</th>
                                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {profile.transactions.map((tx) => (
                                            <tr key={`${tx.type}-${tx.id}`} className="hover:bg-white/[0.02]">
                                                <td className="px-4 py-3 text-xs text-slate-400">
                                                    {format(new Date(tx.date), "dd/MM/yy")}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-200">{tx.type === 'CHARGE' ? 'Cargo' : 'Abono'}</span>
                                                        <span className="text-[10px] text-slate-500">{tx.description}</span>
                                                    </div>
                                                </td>
                                                <td className={`px-4 py-3 text-right font-bold text-sm ${tx.type === 'CHARGE' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                    {tx.type === 'CHARGE' ? '-' : '+'}{formatUSD(Number(tx.amount))}
                                                </td>
                                            </tr>
                                        ))}
                                        {profile.transactions.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="text-center py-8 text-slate-500 text-xs">Sin movimientos registrados</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info (Right Column) */}
                <div className="space-y-6">
                    <div className="glass-card p-6 space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-4">Datos del Cliente</h3>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Mail size={16} className="text-primary-500 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Email</p>
                                    <p className="text-sm text-white break-all">{profile.email || 'No registrado'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin size={16} className="text-primary-500 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Dirección</p>
                                    <p className="text-sm text-white">{profile.address || 'No registrada'}</p>
                                    {profile.city && <p className="text-xs text-slate-400">{profile.city}</p>}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar size={16} className="text-primary-500 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Cliente Desde</p>
                                    <p className="text-sm text-white">{format(new Date(profile.created_at), "MMMM yyyy", { locale: es })}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <a
                                href={`https://wa.me/${profile.phone?.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold transition-all ${profile.phone ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                            >
                                <Phone size={18} />
                                Contactar por WhatsApp
                            </a>
                        </div>
                    </div>

                    {/* Notes Card */}
                    <div className="glass-card p-6 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Notas Internas</h3>
                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 min-h-[100px]">
                            <p className="text-sm text-slate-400 italic">
                                {profile.notes || "Sin notas adicionales."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
