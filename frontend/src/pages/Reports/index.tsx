TrendingDown,
    DollarSign,
    ShoppingBag,
    Wrench,
    FileText,
    PieChart as PieChartIcon
} from 'lucide-react';
import { reportService } from '@/services/api/reportService';
import { toast } from 'sonner';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart as RePieChart,
    Pie
} from 'recharts';
import { useState, useEffect } from 'react';

const MOCK_SALES_DATA = [
    { name: 'Ene', sales: 4000 },
    { name: 'Feb', sales: 3000 },
    { name: 'Mar', sales: 2000 },
    { name: 'Abr', sales: 2780 },
    { name: 'May', sales: 1890 },
    { name: 'Jun', sales: 2390 },
    { name: 'Jul', sales: 3490 },
];

const MOCK_CATEGORY_DATA = [
    { name: 'Electrónica', value: 400, color: '#6366f1' },
    { name: 'Repuestos', value: 300, color: '#ec4899' },
    { name: 'Servicios', value: 300, color: '#f59e0b' },
    { name: 'Accesorios', value: 200, color: '#10b981' },
];

export default function Reports() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);
    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white tracking-tight">Reportes y Analítica</h2>
                    <p className="text-slate-500 font-medium">Visualización de rendimiento y exportación de datos</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="glass px-6 py-3 rounded-2xl border-white/5 text-slate-400 hover:text-white transition-all text-sm font-bold flex items-center gap-2">
                        <Calendar size={18} />
                        Últimos 30 días
                        <ChevronDown size={16} />
                    </button>
                    <button
                        onClick={async () => {
                            const start = '2025-01-01'; // Defaulting for demo, could be picked from state
                            const end = new Date().toISOString().split('T')[0];
                            try {
                                toast.info('Generando reporte P&G...');
                                await reportService.getProfitLoss(start, end, 'pdf');
                            } catch (e) {
                                toast.error('Error al generar reporte');
                            }
                        }}
                        className="btn-primary px-6 py-3 flex items-center gap-2 group shadow-glow"
                    >
                        <FileText size={18} />
                        Exportar P&G (PDF)
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                toast.info('Generando reporte de antigüedad...');
                                await reportService.getAgingReport('pdf');
                            } catch (e) {
                                toast.error('Error al generar reporte');
                            }
                        }}
                        className="glass px-6 py-3 rounded-2xl border-white/5 text-slate-400 hover:text-white transition-all text-sm font-bold flex items-center gap-2"
                    >
                        <History size={18} />
                        Cuentas por Cobrar
                    </button>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ReportKPI
                    label="Ventas Totales"
                    value="$12,450.00"
                    trend="+15%"
                    icon={DollarSign}
                />
                <ReportKPI
                    label="Órdenes"
                    value="142"
                    trend="+8%"
                    icon={ShoppingBag}
                />
                <ReportKPI
                    label="Servicios"
                    value="58"
                    trend="+22%"
                    icon={Wrench}
                />
                <ReportKPI
                    label="Ticket Promedio"
                    value="$87.60"
                    trend="-3%"
                    icon={TrendingUp}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales Chart */}
                <div className="lg:col-span-2 glass-card p-8 border-white/5 space-y-8">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                            <BarChart3 className="text-primary-400" size={20} />
                            Ingresos Mensuales
                        </h3>
                        <div className="flex gap-2">
                            <span className="text-[10px] font-black text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">2026</span>
                        </div>
                    </div>

                    <div className="h-[350px] w-full min-h-[350px] relative">
                        {isMounted && (
                            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                <AreaChart data={MOCK_SALES_DATA}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Categories Chart */}
                <div className="glass-card p-8 border-white/5 space-y-8">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <PieChart className="text-secondary-400" size={20} />
                        Ventas por Categoría
                    </h3>

                    <div className="h-[250px] w-full relative">
                        {isMounted && (
                            <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                <RePieChart>
                                    <Pie
                                        data={MOCK_CATEGORY_DATA}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {MOCK_CATEGORY_DATA.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                </RePieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="space-y-3">
                        {MOCK_CATEGORY_DATA.map((item) => (
                            <div key={item.name} className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-xs font-bold text-slate-400">{item.name}</span>
                                </div>
                                <span className="text-xs font-black text-white">{item.value} unidades</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-8 border-white/5 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest pl-2 border-l-2 border-primary-500">Top Productos</h3>
                        <button className="text-[10px] font-bold text-primary-400 hover:text-primary-300 transition-colors uppercase tracking-widest">Ver Todo</button>
                    </div>
                    <div className="space-y-4">
                        <TopItem label="iPhone 15 Pro Max" value="$4,500" count="3" />
                        <TopItem label="Samsung S24 Ultra" value="$3,200" count="2" />
                        <TopItem label="Pantalla MacBook Air" value="$1,800" count="5" />
                        <TopItem label="Batería Generic X" value="$450" count="12" />
                    </div>
                </div>

                <div className="glass-card p-8 border-white/5 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest pl-2 border-l-2 border-secondary-500">Rendimiento Técnico</h3>
                        <button className="text-[10px] font-bold text-secondary-400 hover:text-secondary-300 transition-colors uppercase tracking-widest">Detalles</button>
                    </div>
                    <div className="space-y-4">
                        <TopItem label="Reparaciones Completadas" value="45" count="92%" color="text-emerald-400" />
                        <TopItem label="Tiempo Promedio" value="2.1 días" count="Rápido" color="text-blue-400" />
                        <TopItem label="Garantías Reclamadas" value="2" count="1.5%" color="text-rose-400" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReportKPI({ label, value, trend, icon: Icon }: any) {
    const isPositive = trend.startsWith('+');
    return (
        <div className="glass-card p-6 border-white/5 relative overflow-hidden group">
            <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-primary-500/20 group-hover:text-primary-400 transition-all">
                    <Icon size={20} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'} px-2 py-1 rounded-lg bg-white/5`}>
                    {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {trend}
                </div>
            </div>
            <div className="mt-4 space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-white tracking-tight">{value}</p>
            </div>
        </div>
    );
}

function TopItem({ label, value, count, color }: any) {
    return (
        <div className="flex justify-between items-center p-3 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5">
            <div className="flex flex-col">
                <span className="text-sm font-bold text-white">{label}</span>
                <span className="text-[10px] text-slate-500 font-medium">{count} items</span>
            </div>
            <span className={`text-sm font-black ${color || 'text-primary-400'}`}>{value}</span>
        </div>
    );
}
