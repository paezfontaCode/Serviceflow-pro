'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { 
  Users, 
  ShoppingBag, 
  Wrench, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Activity,
  Download
} from 'lucide-react'

export default function AdminDashboard() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const response = await api.get('/dashboard/summary')
      return response.data
    }
  })

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/5 border border-white/10" />
        ))}
      </div>
    )
  }

  const stats = [
    { 
      name: 'Ventas Totales', 
      value: summary?.stats?.total_sales || 0, 
      icon: ShoppingBag, 
      change: '+12%', 
      changeType: 'increase',
      color: 'from-blue-500 to-cyan-400',
      shadow: 'shadow-blue-500/20',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400'
    },
    { 
      name: 'Clientes Nuevos', 
      value: summary?.stats?.total_customers || 0, 
      icon: Users, 
      change: '+5%', 
      changeType: 'increase',
      color: 'from-purple-500 to-pink-500',
      shadow: 'shadow-purple-500/20',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400'
    },
    { 
      name: 'Reparaciones', 
      value: summary?.stats?.pending_repairs || 0, 
      icon: Wrench, 
      change: '-2', 
      changeType: 'decrease',
      color: 'from-amber-400 to-orange-500',
      shadow: 'shadow-orange-500/20',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400'
    },
    { 
      name: 'Inventario', 
      value: summary?.stats?.total_products || 0, 
      icon: TrendingUp, 
      change: '+18', 
      changeType: 'increase',
      color: 'from-emerald-400 to-teal-500',
      shadow: 'shadow-emerald-500/20',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400'
    },
  ]

  return (
    <motion.div 
      className="space-y-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Panel Administrativo</h1>
          <p className="mt-1 text-gray-400">Resumen general del negocio.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-white/10 transition-all hover:scale-105 active:scale-95 backdrop-blur-sm">
            <Download className="w-4 h-4" />
            Descargar Reporte
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <motion.div
            key={stat.name}
            variants={item}
            whileHover={{ y: -5 }}
            className="group relative overflow-hidden rounded-3xl bg-[#0a0a0f]/40 p-6 border border-white/5 backdrop-blur-md transition-colors hover:border-white/10"
          >
            {/* Glow Effect */}
            <div className={cn("absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20 bg-gradient-to-br pointer-events-none", stat.color)} />
            
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                <p className="mt-3 text-3xl font-bold text-white tracking-tight">{stat.value}</p>
              </div>
              <div className={cn("rounded-2xl p-3 backdrop-blur-xl border border-white/5", stat.iconBg)}>
                <stat.icon className={cn("h-6 w-6", stat.iconColor)} />
              </div>
            </div>
            
            <div className="mt-6 flex items-center text-sm relative z-10">
              <span className={cn(
                "flex items-center font-bold px-2 py-0.5 rounded-full text-xs",
                stat.changeType === 'increase' 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              )}>
                {stat.changeType === 'increase' ? (
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3" />
                )}
                {stat.change}
              </span>
              <span className="ml-3 text-gray-500 text-xs uppercase tracking-wide font-medium">vs mes anterior</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Chart */}
        <motion.div 
          variants={item}
          className="lg:col-span-2 rounded-3xl bg-[#0a0a0f]/40 border border-white/5 p-6 backdrop-blur-md shadow-inner"
        >
          <div className="mb-8 flex items-center justify-between">
             <div>
                <h3 className="text-lg font-bold text-white">Resumen de Ventas</h3>
                <p className="text-sm text-gray-400">Ingresos brutos de la última semana</p>
             </div>
             <div className="flex gap-2">
                <span className="flex items-center text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-medium shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                   <TrendingUp className="w-3 h-3 mr-1.5" /> +12.5%
                </span>
             </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary?.weekly_chart || []}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(10, 10, 15, 0.8)', 
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '16px',
                    color: '#fff',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
                  }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#818cf8" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#fff', shadow: '0 0 10px #818cf8' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          variants={item}
          className="rounded-3xl bg-[#0a0a0f]/40 border border-white/5 p-6 backdrop-blur-md flex flex-col"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Actividad Reciente</h3>
            <p className="text-sm text-gray-400">Últimas transacciones registradas</p>
          </div>

          <div className="flex-1 relative space-y-8 pl-2">
            {/* Timeline Line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-[1px] bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

            {summary?.recent_sales?.slice(0, 5).map((sale: any, idx: number) => (
              <div key={sale.id} className="relative flex items-center gap-4 group">
                {/* Timeline Dot */}
                <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0a0a0f] border border-white/10 group-hover:border-blue-500/50 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all">
                  <ShoppingBag className="h-4 w-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                </span>
                
                <div className="flex-1 min-w-0 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                   <div className="flex justify-between items-start mb-1">
                     <p className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">Nueva Venta #{sale.id}</p>
                     <span className="font-bold text-emerald-400 text-sm">${sale.total_usd}</span>
                   </div>
                   <p className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </p>
                </div>
              </div>
            ))}
            {(!summary?.recent_sales || summary.recent_sales.length === 0) && (
               <div className="flex h-full flex-col items-center justify-center text-gray-500 gap-3 py-10 opacity-50">
                  <Activity className="h-10 w-10" />
                  <p className="text-sm">No hay actividad reciente</p>
               </div>
            )}
          </div>
          
          <button className="mt-6 w-full rounded-xl border border-white/10 py-3 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all hover:border-white/20">
            Ver todo el historial
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}
