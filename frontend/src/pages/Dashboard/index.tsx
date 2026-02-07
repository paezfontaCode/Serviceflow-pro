import {
  Users,
  ShoppingCart,
  Wrench,
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
import { financeService, ActivityItem as ActivityItemType } from '@/services/api/financeService';
import { formatUSD, formatVES } from '@/utils/currency';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Components
import KPICard from './components/KPICard';
import ActivityItem from './components/ActivityItem';
import ActionAlerts from './components/ActionAlerts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['financeSummary'],
    queryFn: financeService.getSummary,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const { data: cashflow } = useQuery({
    queryKey: ['cashflowHistory'],
    queryFn: () => financeService.getCashflowHistory(7),
  });

  const { data: activity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: () => financeService.getRecentActivity(5),
    refetchInterval: 30000
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight">Centro de Comando</h2>
          <p className="text-slate-500 font-medium">Visión general y alertas operativas</p>
        </div>
        <div className="flex items-center gap-3 glass p-2 rounded-2xl border-white/5">
          <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center text-primary-400">
            <Clock size={20} />
          </div>
          <div className="pr-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado Caja</p>
            <p className={`text-sm font-bold ${summary?.session_active ? 'text-emerald-400' : 'text-rose-400'}`}>
              {summary ? (summary.session_active ? 'SESIÓN ABIERTA' : 'CAJA CERRADA') : 'CARGANDO...'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Alerts (New Phase D) */}
      <ActionAlerts />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Ventas del Día"
          value={formatUSD(summary?.total_sales_today || 0)}
          subValue={formatVES(summary?.total_sales_today_ves || 0)}
          icon={ShoppingCart}
          trend="+14% vs ayer"
          color="primary"
          loading={isLoading}
        />
        <KPICard
          title="Efectivo en Caja"
          value={formatUSD(summary?.cash_in_session || 0)}
          subValue={formatVES(summary?.cash_in_session_ves || 0)}
          icon={DollarSign}
          trend={summary?.session_active ? "Caja abierta" : "Caja cerrada"}
          color="finance"
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

          <div className="h-[350px] w-full relative">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={cashflow || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px'
                    }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ingresos"
                    name="Ingresos"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                  <Area
                    type="monotone"
                    dataKey="egresos"
                    name="Egresos"
                    stroke="#ec4899"
                    strokeWidth={3}
                    fillOpacity={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Actions / Activity */}
        <div className="glass-card p-8 border-white/5 space-y-6 flex flex-col">
          <h3 className="text-lg font-black text-white uppercase tracking-tight">Actividad Reciente</h3>

          <div className="space-y-6 flex-1 overflow-y-auto min-h-[300px] pr-2 custom-scrollbar">
            {isLoadingActivity ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
                <Loader2 className="animate-spin text-slate-500" />
                <span className="text-xs font-bold text-slate-500 uppercase">Cargando...</span>
              </div>
            ) : activity && activity.length > 0 ? (
              activity.map((item: ActivityItemType, idx: number) => (
                <ActivityItem
                  key={idx}
                  icon={
                    item.type === 'sale' ? CheckCircle2 :
                      item.type === 'repair' ? Wrench :
                        item.type === 'customer' ? Users : AlertCircle
                  }
                  title={item.title}
                  time={item.time}
                  desc={item.description}
                  color={
                    item.color === 'emerald' ? 'text-emerald-400' :
                      item.color === 'primary' ? 'text-primary-400' :
                        item.color === 'blue' ? 'text-blue-400' : 'text-amber-400'
                  }
                  bg={
                    item.color === 'emerald' ? 'bg-emerald-500/10' :
                      item.color === 'primary' ? 'bg-primary-500/10' :
                        item.color === 'blue' ? 'bg-blue-500/10' : 'bg-amber-500/10'
                  }
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 opacity-30">
                <Clock className="text-slate-500" size={32} />
                <span className="text-xs font-bold text-slate-500 uppercase text-center">Sin actividad reciente</span>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/reports')}
            className="w-full py-4 text-[10px] font-black uppercase text-slate-500 border border-dashed border-white/10 rounded-2xl hover:text-white hover:border-white/20 transition-all hover:bg-white/5 mt-auto"
          >
            Ver Todo el Historial
          </button>
        </div>
      </div>
    </div>
  );
}

function Last7Days() {
  return <option>Últimos 7 días</option>;
}
