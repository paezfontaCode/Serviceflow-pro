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
  Activity
} from 'lucide-react'



export default function DashboardPage() {
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
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
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
      shadow: 'shadow-blue-500/20'
    },
    { 
      name: 'Clientes Nuevos', 
      value: summary?.stats?.total_customers || 0, 
      icon: Users, 
      change: '+5%', 
      changeType: 'increase',
      color: 'from-purple-500 to-pink-500',
      shadow: 'shadow-purple-500/20'
    },
    { 
      name: 'Reparaciones', 
      value: summary?.stats?.pending_repairs || 0, 
      icon: Wrench, 
      change: '-2', 
      changeType: 'decrease',
      color: 'from-amber-400 to-orange-500',
      shadow: 'shadow-orange-500/20'
    },
    { 
      name: 'Inventario', 
      value: summary?.stats?.total_products || 0, 
      icon: TrendingUp, 
      change: '+18', 
      changeType: 'increase',
      color: 'from-emerald-400 to-teal-500',
      shadow: 'shadow-emerald-500/20'
    },
  ]

  return (
    <motion.div 
      className="space-y-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Panel Principal</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Resumen de actividad en tiempo real.</p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-all">
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
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800"
          >
            <div className={cn("absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20 bg-gradient-to-br", stat.color)} />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={cn("rounded-xl p-3 bg-gradient-to-br text-white shadow-lg", stat.color, stat.shadow)}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            
            <div className="mt-4 flex items-center text-sm">
              <span className={cn(
                "flex items-center font-medium",
                stat.changeType === 'increase' ? "text-green-500" : "text-red-500"
              )}>
                {stat.changeType === 'increase' ? (
                  <ArrowUpRight className="mr-1 h-4 w-4" />
                ) : (
                  <ArrowDownRight className="mr-1 h-4 w-4" />
                )}
                {stat.change}
              </span>
              <span className="ml-2 text-gray-400">vs mes anterior</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Chart */}
        <motion.div 
          variants={item}
          className="lg:col-span-2 rounded-3xl bg-white dark:bg-gray-900 p-6 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800"
        >
          <div className="mb-6 flex items-center justify-between">
             <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Resumen de Ventas</h3>
                <p className="text-sm text-gray-500">Ingresos de la última semana</p>
             </div>
             <div className="flex gap-2">
                <span className="flex items-center text-sm text-green-500 bg-green-500/10 px-2 py-1 rounded-full font-medium">
                   <TrendingUp className="w-3 h-3 mr-1" /> +12.5%
                </span>
             </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary?.weekly_chart || []}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          variants={item}
          className="rounded-3xl bg-white dark:bg-gray-900 p-6 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800"
        >
          <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">Actividad Reciente</h3>
          <div className="relative border-l border-gray-200 dark:border-gray-800 ml-3 space-y-8">
            {summary?.recent_sales?.slice(0, 5).map((sale: any, idx: number) => (
              <div key={sale.id} className="relative ml-6">
                <span className="absolute -left-[31px] flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 ring-4 ring-white dark:ring-gray-900">
                  <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </span>
                <div className="flex flex-col">
                   <p className="text-sm font-semibold text-gray-900 dark:text-white">Nueva Venta #{sale.id}</p>
                   <p className="text-xs text-gray-500">
                      {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span className="mx-1">•</span>
                      <span className="font-medium text-green-500">${sale.total_usd}</span>
                   </p>
                </div>
              </div>
            ))}
            {(!summary?.recent_sales || summary.recent_sales.length === 0) && (
               <div className="ml-6 flex h-full flex-col items-center justify-center text-gray-500 gap-2 py-10">
                  <Activity className="h-8 w-8 opacity-20" />
                  <p className="text-sm">No hay actividad reciente</p>
               </div>
            )}
          </div>
          
          <button className="mt-8 w-full rounded-xl border border-gray-200 dark:border-gray-800 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Ver todo el historial
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}
