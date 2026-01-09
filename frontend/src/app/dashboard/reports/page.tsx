'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportService } from '@/lib/reportService'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Loader2,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle
} from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts'

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })

  const { data: plReport, isLoading: isLoadingPL } = useQuery({
    queryKey: ['profit-loss', dateRange],
    queryFn: () => reportService.getProfitLoss(dateRange.start, dateRange.end)
  })

  const { data: agingReport, isLoading: isLoadingAging } = useQuery({
    queryKey: ['aging-report'],
    queryFn: () => reportService.getAging()
  })

  const plChartData = plReport ? [
    { name: 'Ventas', value: plReport.revenue, color: '#3b82f6' },
    { name: 'Costo Ventas', value: plReport.cogs, color: '#f59e0b' },
    { name: 'Gastos Op.', value: plReport.expenses, color: '#ef4444' },
    { name: 'Utilidad Neta', value: plReport.net_profit, color: '#10b981' },
  ] : []

  const agingChartData = agingReport ? Object.entries(agingReport).map(([key, value]) => ({
    name: key + ' Días',
    value: Number(value)
  })) : []

  const COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444']

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes y Analíticas</h1>
            <p className="text-gray-600 dark:text-gray-400">Estado financiero y rendimiento del negocio</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <Calendar className="h-4 w-4 text-gray-400 ml-2" />
          <input 
            type="date" 
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            className="bg-transparent border-none text-sm focus:ring-0" 
          />
          <span className="text-gray-400">al</span>
          <input 
            type="date" 
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            className="bg-transparent border-none text-sm focus:ring-0" 
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="text-gray-500 text-sm font-medium">Ventas Totales</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            ${plReport?.revenue.toFixed(2) || '0.00'}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="text-gray-500 text-sm font-medium">Gastos Operativos</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            ${plReport?.expenses.toFixed(2) || '0.00'}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="text-gray-500 text-sm font-medium">Utilidad Neta</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            ${plReport?.net_profit.toFixed(2) || '0.00'}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="text-gray-500 text-sm font-medium">Saldo en CxC (Mora)</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            ${Object.values(agingReport || {}).reduce((a, b) => a + Number(b), 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L Chart */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Estado de Resultados (P&L)
            </h3>
          </div>
          <div className="h-[300px]">
             {isLoadingPL ? (
               <div className="h-full flex items-center justify-center font-bold"><Loader2 className="animate-spin mr-2" /> Cargando datos...</div>
             ) : (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={plChartData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                   <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', color: '#fff' }}
                     formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Monto']}
                   />
                   <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                     {plChartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             )}
          </div>
        </div>

        {/* Aging Chart */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <PieChart className="h-5 w-5 text-orange-500" />
              Antigüedad de Cuentas por Cobrar
            </h3>
          </div>
          <div className="h-[300px] flex items-center justify-center">
             {isLoadingAging ? (
               <div className="font-bold"><Loader2 className="animate-spin mr-2" /> Cargando...</div>
             ) : (
               <ResponsiveContainer width="100%" height="100%">
                 <RePieChart>
                    <Pie
                      data={agingChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {agingChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', color: '#fff' }}
                      formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Saldo']}
                    />
                 </RePieChart>
               </ResponsiveContainer>
             )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
             {agingChartData.map((entry, idx) => (
               <div key={entry.name} className="flex items-center gap-2 text-xs text-gray-500">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                 {entry.name}
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  )
}
