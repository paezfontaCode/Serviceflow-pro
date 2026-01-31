import {
  Users,
  ShoppingCart,
  Wrench,
  ArrowUpRight,
  DollarSign,
  CircleAlert as AlertCircle,
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { financeService } from '@/services/api/financeService';
import { formatUSD, formatVES, formatExchangeRate } from '@/utils/currency';
import { useState, useEffect } from 'react';

// Chart data is now fetched from the API

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const { data: summary, isLoading } = useQuery({
    queryKey: ['financeSummary'],
    queryFn: financeService.getSummary,
  });

  const { data: cashflow } = useQuery({
    queryKey: ['cashflowHistory'],
    queryFn: () => financeService.getCashflowHistory(7),
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight">Panel de Control</h2>
          <p className="text-slate-500 font-medium">Resumen general del rendimiento del negocio</p>
        </div>
        <div className="flex items-center gap-3 glass p-2 rounded-2xl border-white/5">
          <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center text-primary-400">
            <Clock size={20} />
          </div>
          <div className="pr-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado Caja</p>
            <p className={`text-sm font-bold ${summary?.session_active ? 'text-emerald-400' : 'text-rose-400'}`}>
              {summary?.session_active ? 'SESIÓN ABIERTA' : 'CAJA CERRADA'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Ventas del Día"
          value={formatUSD(summary?.cash_in_session || 0)}
          subValue={formatVES(summary?.cash_in_session_ves || 0)}
          icon={ShoppingCart}
          trend="+14% vs ayer"
          color="primary"
          loading={isLoading}
        />
        <KPICard
          title="Cuentas por Cobrar"
          value={formatUSD(summary?.total_receivables || 0)}
          icon={Users}
          trend={`${summary?.morosos_count || 0} deudores críticos`}
          color="warning"
          loading={isLoading}
        />
        <KPICard
          title="Monto en Riesgo"
          value={formatUSD(summary?.overdue_amount || 0)}
          icon={AlertCircle}
          trend="Facturas vencidas"
          color="danger"
          loading={isLoading}
        />
        <KPICard
          title="Tasa de Cambio"
          value={`${formatExchangeRate(summary?.exchange_rate || 0)} Bs.`}
          icon={DollarSign}
          trend="Tasa actual BCV"
          color="finance"
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 glass-card p-8 border-white/5 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Tendencia de Ingresos</h3>
            <select className="bg-white/5 border-none rounded-xl text-xs font-bold text-slate-400 focus:ring-1 focus:ring-primary-500/50 cursor-pointer p-2 px-4 outline-none">
              <Last7Days />
            </select>
          </div>

          <div className="h-[350px] w-full min-h-[350px] relative">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <AreaChart data={cashflow || []}>
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
                  <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="egresos" name="Egresos" stroke="#ec4899" strokeWidth={3} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Actions / Activity */}
        <div className="glass-card p-8 border-white/5 space-y-6">
          <h3 className="text-lg font-black text-white uppercase tracking-tight">Actividad Reciente</h3>
          <div className="space-y-6">
            <ActivityItem
              icon={CheckCircle2}
              title="Venta Finalizada"
              time="Hace 5 min"
              desc="Venta #4502 por $45.00"
              color="text-emerald-400"
              bg="bg-emerald-500/10"
            />
            <ActivityItem
              icon={Wrench}
              title="Equipo Recibido"
              time="Hace 15 min"
              desc="iPhone 13 - Cambio de pantalla"
              color="text-primary-400"
              bg="bg-primary-500/10"
            />
            <ActivityItem
              icon={AlertCircle}
              title="Stock Bajo"
              time="Hace 1 hora"
              desc="Memoria RAM 8GB (Quedan 2)"
              color="text-amber-400"
              bg="bg-amber-500/10"
            />
            <ActivityItem
              icon={Users}
              title="Nuevo Cliente"
              time="Hace 2 horas"
              desc="Juan Perez - Registrado"
              color="text-blue-400"
              bg="bg-blue-500/10"
            />
          </div>
          <button className="w-full py-4 text-[10px] font-black uppercase text-slate-500 border border-dashed border-white/10 rounded-2xl hover:text-white hover:border-white/20 transition-all">
            Ver Todo el Historial
          </button>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, subValue, icon: Icon, trend, color, loading }: any) {
  const colorMap: any = {
    primary: 'text-primary-400 bg-primary-500/10 shadow-glow',
    finance: 'text-finance bg-finance/10',
    warning: 'text-amber-400 bg-amber-500/10',
    danger: 'text-rose-400 bg-rose-500/10',
  };

  if (loading) {
    return (
      <div className="glass-card p-6 border-white/5 h-[160px] flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-700" size={32} />
      </div>
    );
  }

  return (
    <div className="glass-card p-6 border-white/5 group hover:scale-[1.02] transition-all relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colorMap[color]} group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
          <ArrowUpRight size={12} />
          {trend}
        </div>
      </div>
      <div className="space-y-1">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</h4>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-black text-white">{value}</p>
          {subValue && <span className="text-xs font-bold text-slate-500">≈ {subValue}</span>}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ icon: Icon, title, time, desc, color, bg }: any) {
  return (
    <div className="flex gap-4 group cursor-pointer hover:translate-x-1 transition-transform">
      <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
        <Icon size={18} />
      </div>
      <div className="space-y-1 border-b border-white/5 pb-4 w-full">
        <div className="flex justify-between items-center">
          <p className="text-xs font-bold text-white uppercase">{title}</p>
          <p className="text-[10px] text-slate-500 font-medium">{time}</p>
        </div>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

function Last7Days() {
  return <option>Últimos 7 días</option>;
}
