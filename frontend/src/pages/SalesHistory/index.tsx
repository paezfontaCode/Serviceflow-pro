import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
    Search,
    Download,
    Printer,
    History,
    TrendingUp,
    Clock,
    AlertCircle,
    MoreVertical,
    Loader2
} from 'lucide-react';
import { salesService } from '@/services/api/salesService';
import { formatUSD, formatVES } from '@/utils/currency';
import { ticketService } from '@/services/ticketService';
import { toast } from 'sonner';

export default function SalesHistory() {
    const { t } = useTranslation();
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        payment_status: '',
    });
    const [search, setSearch] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['salesHistory', filters],
        queryFn: () => salesService.getHistory(filters),
    });

    const handlePrintTicket = async (saleId: number) => {
        try {
            const sale = await salesService.getSale(saleId);
            ticketService.generateThermalTicket({
                orderId: sale.id,
                customerName: sale.customer_name || 'Cliente Ocasional',
                items: sale.items.map(i => ({
                    name: i.product_name || 'Producto',
                    quantity: i.quantity,
                    price: Number(i.unit_price_usd)
                })),
                totalUsd: Number(sale.total_usd),
                amountPaid: Number(sale.paid_amount),
                pendingDebt: Number(sale.pending_amount),
                exchangeRate: Number(sale.exchange_rate),
                paymentMethod: sale.payment_method.toUpperCase(),
                date: sale.created_at,
            });
            toast.success('Ticket enviado a impresión');
        } catch (error) {
            toast.error('Error al generar el ticket');
        }
    };

    const filteredSales = data?.sales.filter(s =>
        s.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toString().includes(search)
    ) || [];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <History className="text-primary-500" size={32} />
                        {t('history_page.title')}
                    </h2>
                    <p className="text-slate-500 font-medium">{t('history_page.subtitle')}</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="glass p-3 rounded-2xl border-white/5 text-slate-400 hover:text-white transition-all" title="Exportar CSV">
                        <Download size={20} />
                    </button>
                    <button className="btn-primary px-6 py-3 text-sm font-bold flex items-center gap-2">
                        <Printer size={18} />
                        Reporte Diario
                    </button>
                </div>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard
                    title={t('history_page.total_sold')}
                    value={formatUSD(data?.summary.total_revenue_usd || 0)}
                    icon={TrendingUp}
                    color="primary"
                    loading={isLoading}
                />
                <SummaryCard
                    title={t('history_page.pending_debt')}
                    value={formatUSD(data?.summary.total_pending_usd || 0)}
                    icon={AlertCircle}
                    color="warning"
                    loading={isLoading}
                />
                <SummaryCard
                    title={t('history_page.sales_count')}
                    value={data?.summary.count || 0}
                    icon={Clock}
                    color="finance"
                    loading={isLoading}
                />
            </div>

            {/* Filters Bar */}
            <div className="glass-card p-6 border-white/10 flex flex-col lg:flex-row gap-6 items-end">
                <div className="flex-1 w-full space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('history_page.search_placeholder').split('...')[0]}</label>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={t('history_page.search_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:border-primary-500 outline-none transition-all shadow-inner"
                        />
                    </div>
                </div>

                <div className="w-full lg:w-48 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('history_page.table_status')}</label>
                    <select
                        value={filters.payment_status}
                        onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:border-primary-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                        <option value="">{t('history_page.status_all')}</option>
                        <option value="paid">{t('history_page.status_paid')}</option>
                        <option value="partial">{t('history_page.status_partial')}</option>
                        <option value="pending">{t('history_page.status_pending')}</option>
                    </select>
                </div>

                <div className="w-full lg:w-48 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Desde</label>
                    <input
                        type="date"
                        value={filters.start_date}
                        onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:border-primary-500 outline-none transition-all cursor-pointer"
                    />
                </div>

                <div className="w-full lg:w-48 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Hasta</label>
                    <input
                        type="date"
                        value={filters.end_date}
                        onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:border-primary-500 outline-none transition-all cursor-pointer"
                    />
                </div>
            </div>

            {/* Sales Table */}
            <div className="glass-card border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('history_page.table_id_date')}</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('history_page.table_customer')}</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('history_page.table_total')}</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('history_page.table_paid_rest')}</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('history_page.table_status')}</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('history_page.table_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-50">
                                            <Loader2 className="animate-spin text-primary-500" size={32} />
                                            <span className="font-bold text-slate-500 uppercase tracking-widest text-xs">Cargando ventas...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <History size={48} className="text-slate-500" />
                                            <span className="font-bold text-slate-500 uppercase tracking-widest text-xs">No se encontraron ventas</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredSales.map((sale) => (
                                    <tr key={sale.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="p-5">
                                            <div className="font-bold text-white mb-1">#{sale.id.toString().padStart(6, '0')}</div>
                                            <div className="text-[10px] text-slate-500 font-medium">
                                                {new Date(sale.created_at).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="font-bold text-slate-300">{sale.customer_name}</div>
                                            <div className="text-[10px] text-slate-500 uppercase">{sale.payment_method}</div>
                                        </td>
                                        <td className="p-5">
                                            <div className="font-black text-white">{formatUSD(sale.total_usd)}</div>
                                            <div className="text-[10px] text-slate-500">{formatVES(sale.total_ves)}</div>
                                        </td>
                                        <td className="p-5">
                                            <div className="font-bold text-emerald-400">{formatUSD(sale.paid_amount || 0)}</div>
                                            {Number(sale.pending_amount) > 0 && (
                                                <div className="text-[10px] text-rose-400 font-black">Resta: {formatUSD(sale.pending_amount || 0)}</div>
                                            )}
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${sale.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                sale.payment_status === 'partial' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                }`}>
                                                {sale.payment_status === 'paid' ? t('history_page.status_paid') :
                                                    sale.payment_status === 'partial' ? t('history_page.status_partial') : t('history_page.status_pending')}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2 transform transition-all group-hover:translate-x-1">
                                                <button
                                                    onClick={() => handlePrintTicket(sale.id)}
                                                    className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-glow-hover"
                                                    title="Reimprimir Ticket"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                <button className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ title, value, icon: Icon, color, loading }: any) {
    const colors = {
        primary: 'text-primary-400 bg-primary-500/10 shadow-glow border-primary-500/20',
        warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        finance: 'text-finance bg-finance/10 border-finance/20',
    };

    return (
        <div className="glass-card p-6 border-white/5 group hover:scale-[1.02] transition-all relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colors[color as keyof typeof colors]} group-hover:scale-110 transition-transform border`}>
                    <Icon size={24} />
                </div>
                {loading && <Loader2 className="animate-spin text-slate-700" size={20} />}
            </div>
            <div className="space-y-1">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</h4>
                <p className="text-3xl font-black text-white tracking-tight">{value}</p>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-150 group-hover:opacity-[0.05] transition-all duration-700">
                <Icon size={80} />
            </div>
        </div>
    );
}
