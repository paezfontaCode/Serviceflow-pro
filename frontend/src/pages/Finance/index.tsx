import { 
    TrendingUp, 
    TrendingDown, 
    ArrowUpRight, 
    Calendar,
    Filter,
    ArrowRight,
    Loader2,
    Users
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { financeService, CashSessionRead } from '@/services/api/financeService';
import { formatUSD, formatVES } from '@/utils/currency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer
} from 'recharts';
import { useState, useEffect } from 'react';

const MOCK_FINANCE_DATA = [
    { name: 'Lun', ingresos: 4500, egresos: 1200 },
    { name: 'Mar', ingresos: 3800, egresos: 2100 },
    { name: 'Mie', ingresos: 5200, egresos: 1800 },
    { name: 'Jue', ingresos: 4800, egresos: 2500 },
    { name: 'Vie', ingresos: 6100, egresos: 3000 },
    { name: 'Sab', ingresos: 7500, egresos: 4200 },
    { name: 'Dom', ingresos: 3200, egresos: 1500 },
];

export default function Finance() {
    const [isMounted, setIsMounted] = useState(false);
    const { data: summary, isLoading } = useQuery({
        queryKey: ['financeSummary'],
        queryFn: financeService.getSummary,
    });

    const { data: sessions } = useQuery({
        queryKey: ['cashSessions'],
        queryFn: financeService.getCashSessions,
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);


    if (isLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white tracking-tight">Módulo Financiero</h2>
                    <p className="text-slate-500 font-medium">Consolidado general y control de flujo de caja</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="btn-primary px-6 py-3 text-sm flex items-center gap-2 group">
                        <Calendar size={18} />
                        Cierre de Mes
                    </button>
                    <button className="glass px-6 py-3 rounded-2xl border-white/5 text-slate-400 hover:text-white transition-all text-sm font-bold flex items-center gap-2">
                        <Filter size={18} />
                        Filtrar
                    </button>
                </div>
            </div>

            {/* Financial Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FinancialCard 
                    title="Utilidad Estimada"
                    amount={formatUSD(summary?.cash_in_session || 0)} 
                    subAmount={formatVES(summary?.cash_in_session_ves || 0)}
                    icon={TrendingUp}
                    trend="+12.5%"
                    color="primary"
                    description="Ventas menos gastos (Día)"
                />
                <FinancialCard 
                    title="Cuentas por Cobrar"
                    amount={formatUSD(summary?.total_receivables || 0)} 
                    icon={Users}
                    trend={`${summary?.morosos_count || 0} deudores`}
                    color="warning"
                    description="Pendiente por recaudar"
                />
                <FinancialCard 
                    title="Monto en Riesgo"
                    amount={formatUSD(summary?.overdue_amount || 0)} 
                    icon={TrendingDown}
                    trend="Vencido"
                    color="danger"
                    description="Facturas con retraso"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cashflow Chart */}
                <div className="lg:col-span-2 glass-card p-8 border-white/5 space-y-8">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Flujo de Caja</h3>
                            <p className="text-xs text-slate-500 font-medium">Histórico semanal de ingresos vs egresos</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Ingresos</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Egresos</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[350px] w-full min-h-[350px] relative">
                        {isMounted && (
                            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                <AreaChart data={MOCK_FINANCE_DATA}>
                                <defs>
                                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="ingresos" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorIngresos)" />
                                <Area type="monotone" dataKey="egresos" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorEgresos)" strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Quick Reports */}
                <div className="space-y-6">
                    <div className="glass-card p-6 border-white/5 space-y-6">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest pl-2 border-l-2 border-primary-500">Recaudación por Método</h3>
                        <div className="space-y-4">
                            <MethodProgress label="Efectivo" amount="$1,240.00" progress={65} color="bg-emerald-500" />
                            <MethodProgress label="Punto de Venta" amount="$890.50" progress={45} color="bg-primary-500" />
                            <MethodProgress label="Pago Móvil" amount="$450.00" progress={25} color="bg-amber-500" />
                            <MethodProgress label="Transferencia" amount="$320.00" progress={15} color="bg-blue-500" />
                        </div>
                    </div>

                    <div className="glass-card p-6 border-white/5 space-y-6 bg-gradient-to-br from-primary-600/10 to-transparent">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400">
                                <TrendingUp size={20} />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight">Acciones Rápidas</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <button className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-all group border border-white/5">
                                <span className="text-xs font-bold text-slate-300">Resumen del Turno</span>
                                <ArrowRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-all group border border-white/5">
                                <span className="text-xs font-bold text-slate-300">Cuentas Pendientes</span>
                                <ArrowRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-all group border border-white/5">
                                <span className="text-xs font-bold text-slate-300">Reporte de Gastos</span>
                                <ArrowRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Session History Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between pl-2 border-l-4 border-primary-500">
                    <div className="space-y-0.5">
                        <h3 className="text-xl font-black text-white tracking-tight uppercase">Historial de Sesiones</h3>
                        <p className="text-xs text-slate-500 font-medium">Control de aperturas y cierres de caja</p>
                    </div>
                </div>

                <div className="glass-card border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/5">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Código / Fecha</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Apertura</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cierre Esperado</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Diferencia</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {sessions?.map((session: CashSessionRead) => (
                                    <tr key={session.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold">{session.session_code}</span>
                                                <span className="text-[10px] text-slate-500 uppercase tracking-tighter">
                                                    {format(new Date(session.opened_at), "dd MMM yyyy, HH:mm", { locale: es })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold">{formatUSD(Number(session.opening_amount))}</span>
                                                <span className="text-[10px] text-slate-500">{formatVES(Number(session.opening_amount_ves))}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold">{formatUSD(Number(session.expected_amount))}</span>
                                                <span className="text-[10px] text-slate-500">{formatVES(Number(session.expected_amount_ves))}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {session.status === 'closed' ? (
                                                <div className="flex flex-col">
                                                    <span className={`font-bold ${(Number(session.shortage) > 0 || Number(session.shortage_ves) > 0) ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                        {Number(session.overage) > 0 ? `+${formatUSD(Number(session.overage))}` : 
                                                         Number(session.shortage) > 0 ? `-${formatUSD(Number(session.shortage))}` : '0.00 USD'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">
                                                        {Number(session.overage_ves) > 0 ? `+${formatVES(Number(session.overage_ves))}` : 
                                                         Number(session.shortage_ves) > 0 ? `-${formatVES(Number(session.shortage_ves))}` : '0.00 VES'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-500 italic text-xs">En progreso...</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${session.status === 'open' ? 'bg-emerald-500/10 text-emerald-500 animate-pulse' : 'bg-slate-500/10 text-slate-500'}`}>
                                                {session.status === 'open' ? 'Abierta' : 'Cerrada'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

    );
}

function FinancialCard({ title, amount, subAmount, icon: Icon, trend, color, description }: any) {
    const colorStyles: any = {
        primary: { bg: 'bg-primary-500/10', text: 'text-primary-400', glow: 'shadow-glow' },
        warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', glow: '' },
        danger: { bg: 'bg-rose-500/10', text: 'text-rose-400', glow: '' }
    };

    const style = colorStyles[color];

    return (
        <div className="glass-card p-6 border-white/5 relative overflow-hidden group hover:scale-[1.02] transition-all ">
            <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${style.bg} ${style.text} ${style.glow} group-hover:rotate-6 transition-transform`}>
                    <Icon size={24} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
                    <ArrowUpRight size={12} />
                    {trend}
                </div>
            </div>
            <div className="space-y-1">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</h4>
                <div className="flex items-baseline gap-3">
                    <p className="text-3xl font-black text-white">{amount}</p>
                    {subAmount && <span className="text-sm font-bold text-slate-500">≈ {subAmount}</span>}
                </div>
                <p className="text-[10px] text-slate-600 font-medium pt-1 uppercase tracking-tight">{description}</p>
            </div>
            
            {/* Decoration */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${style.bg} blur-3xl opacity-20 pointer-events-none`}></div>
        </div>
    );
}

function MethodProgress({ label, amount, progress, color }: any) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                <span className="text-slate-400">{label}</span>
                <span className="text-white">{amount}</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${color} rounded-full transition-all duration-1000`} 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
}
