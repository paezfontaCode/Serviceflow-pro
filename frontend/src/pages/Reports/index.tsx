import {
    TrendingDown,
    DollarSign,
    ShoppingBag,
    Wrench,
    FileText,
    PieChart as PieChartIcon,
    BarChart3,
    Calendar,
    ChevronDown,
    History,
    TrendingUp
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
import { useQuery } from '@tanstack/react-query';

export default function Reports() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const { data: summary } = useQuery({
        queryKey: ['reports', 'summary'],
        queryFn: reportService.getDashboardSummary
    });

    const { data: monthlySales } = useQuery({
        queryKey: ['reports', 'monthly'],
        queryFn: reportService.getMonthlySales
    });

    const { data: categoryData } = useQuery({
        queryKey: ['reports', 'categories'],
        queryFn: reportService.getCategoryDistribution
    });

    const { data: topProducts } = useQuery({
        queryKey: ['reports', 'top-products'],
        queryFn: () => reportService.getTopProducts(5)
    });

    const { data: techStats } = useQuery({
        queryKey: ['reports', 'tech-performance'],
        queryFn: reportService.getTechnicianPerformance
    });

    // Default values to prevent crashes if data is loading
    const kpiData = summary || [
        { label: "Ventas Totales", value: 0, trend: "0%", icon: "DollarSign" },
        { label: "Órdenes", value: "0", trend: "0%", icon: "ShoppingBag" },
        { label: "Servicios", value: "0", trend: "0%", icon: "Wrench" },
        { label: "Ticket Promedio", value: 0, trend: "0%", icon: "TrendingUp" }
    ];

    const chartData = monthlySales || [];
    const catData = categoryData || [];
    const products = topProducts || [];
    const techPerformance = techStats || [];

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
                        Este Mes
                        <ChevronDown size={16} />
                    </button>
                    <button
                        onClick={async () => {
                            const start = '2025-01-01';
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
                {kpiData.map((kpi: any, index: number) => {
                    const Icon = kpi.icon === 'DollarSign' ? DollarSign :
                        kpi.icon === 'ShoppingBag' ? ShoppingBag :
                            kpi.icon === 'Wrench' ? Wrench : TrendingUp;
                    return (
                        <ReportKPI
                            key={index}
                            label={kpi.label}
                            value={typeof kpi.value === 'number' && kpi.icon === 'DollarSign' ? `$${kpi.value.toLocaleString()}` : kpi.value}
                            trend={kpi.trend}
                            icon={Icon}
                        />
                    );
                })}
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
                            <span className="text-[10px] font-black text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">{new Date().getFullYear()}</span>
                        </div>
                    </div>

                    <div className="h-[350px] w-full min-h-[350px] relative min-w-0">
                        {isMounted && (
                            <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0} minHeight={0}>
                                <AreaChart data={chartData}>
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
                        <PieChartIcon className="text-secondary-400" size={20} />
                        Ventas por Categoría
                    </h3>

                    <div className="h-[250px] w-full relative min-w-0">
                        {isMounted && catData.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0} minHeight={0}>
                                <RePieChart>
                                    <Pie
                                        data={catData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {catData.map((entry: any, index: number) => (
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
                        {catData.length === 0 && (
                            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                                No hay datos disponibles
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        {catData.map((item: any) => (
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
                        {products.map((p: any, i: number) => (
                            <TopItem
                                key={i}
                                label={p.label}
                                value={`$${p.value}`}
                                count={`${p.count} vendidos`}
                            />
                        ))}
                        {products.length === 0 && <p className="text-slate-500 text-sm">No hay productos top aún.</p>}
                    </div>
                </div>

                <div className="glass-card p-8 border-white/5 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest pl-2 border-l-2 border-secondary-500">Rendimiento Técnico</h3>
                        <button className="text-[10px] font-bold text-secondary-400 hover:text-secondary-300 transition-colors uppercase tracking-widest">Detalles</button>
                    </div>
                    <div className="space-y-4">
                        {techPerformance.map((item: any, i: number) => (
                            <TopItem
                                key={i}
                                label={item.label}
                                value={item.value}
                                count={item.count}
                                color={item.color}
                            />
                        ))}
                        {techPerformance.length === 0 && <p className="text-slate-500 text-sm">No hay datos técnicos.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReportKPI({ label, value, trend, icon: Icon }: any) {
    // Un simple chequeo: si startsWith '-' es negativo.
    const isNegative = trend.startsWith('-');

    return (
        <div className="glass-card p-6 border-white/5 relative overflow-hidden group">
            <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-primary-500/20 group-hover:text-primary-400 transition-all">
                    <Icon size={20} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black ${isNegative ? 'text-rose-400' : 'text-emerald-400'} px-2 py-1 rounded-lg bg-white/5`}>
                    {isNegative ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
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
                <span className="text-[10px] text-slate-500 font-medium">{count}</span>
            </div>
            <span className={`text-sm font-black ${color || 'text-primary-400'}`}>{value}</span>
        </div>
    );
}
