'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { financeService, FinanceSummary, MorososResponse } from '@/lib/financeService'
import { reportService } from '@/lib/reportService'
import { useFinanceStore } from '@/store/useFinanceStore'
import {
  TrendingUp,
  Wallet,
  ArrowRight,
  Save,
  Loader2,
  AlertTriangle,
  DollarSign,
  Users,
  Phone,
  CreditCard,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Banknote
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import Link from 'next/link'

const AGING_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444']

function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 2 }: { 
  value: number; prefix?: string; suffix?: string; decimals?: number 
}) {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    const duration = 1000
    const steps = 30
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(current)
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])
  
  return (
    <span className="tabular-nums">
      {prefix}{displayValue.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  )
}

export default function FinanceDashboard() {
  const [rate, setRate] = useState<string>('')
  const [isUpdatingRate, setIsUpdatingRate] = useState(false)
  const {
    currentSession,
    fetchCurrentSession,
    closeSession,
    isLoading: isSessionLoading,
  } = useFinanceStore()
  const [actualAmount, setActualAmount] = useState<string>('')
  const [actualAmountVES, setActualAmountVES] = useState<string>('')

  // Fetch data
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: financeService.getFinanceSummary,
    refetchInterval: 30000
  })

  const { data: morosos, isLoading: isMorososLoading } = useQuery({
    queryKey: ['morosos'],
    queryFn: financeService.getMorosos
  })

  const { data: agingReport } = useQuery({
    queryKey: ['aging-report'],
    queryFn: reportService.getAging
  })

  useEffect(() => {
    fetchCurrentSession()
    financeService.getCurrentRate()
      .then((data) => setRate(Number(data.rate).toString()))
      .catch(() => {})
  }, [fetchCurrentSession])

  const handleUpdateRate = async () => {
    setIsUpdatingRate(true)
    try {
      await financeService.updateExchangeRate(parseFloat(rate))
      alert('Tasa actualizada correctamente')
    } catch (err) {
      alert('Error al actualizar tasa')
    } finally {
      setIsUpdatingRate(false)
    }
  }

  const handleCloseSession = async () => {
    if (!confirm('¿Estás seguro de que deseas cerrar la caja?')) return
    try {
      await closeSession(parseFloat(actualAmount), parseFloat(actualAmountVES))
      alert('Caja cerrada correctamente')
      setActualAmount('')
      setActualAmountVES('')
    } catch (err: any) {
      alert(err.message)
    }
  }

  const agingChartData = agingReport ? [
    { name: '0-30 días', value: Number(agingReport['0-30'] || 0), color: AGING_COLORS[0] },
    { name: '31-60 días', value: Number(agingReport['31-60'] || 0), color: AGING_COLORS[1] },
    { name: '61-90 días', value: Number(agingReport['61-90'] || 0), color: AGING_COLORS[2] },
    { name: '90+ días', value: Number(agingReport['90+'] || 0), color: AGING_COLORS[3] },
  ] : []

  const totalAging = agingChartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Wallet className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">Panel Financiero</h1>
            <p className="text-gray-500 dark:text-gray-400">Control de caja, créditos y cobranzas</p>
          </div>
        </div>
        
        {/* Exchange Rate Badge */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-5 py-3 rounded-2xl border border-blue-100 dark:border-blue-800">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-24 h-9 text-lg font-bold text-center border-none bg-white/50 dark:bg-gray-800/50"
              placeholder="36.50"
              step="0.01"
            />
            <span className="text-sm font-bold text-gray-500">Bs/$</span>
            <Button
              onClick={handleUpdateRate}
              className="h-9 px-3 bg-blue-600 hover:bg-blue-700"
              disabled={isUpdatingRate}
            >
              {isUpdatingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Receivables */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <Link href="/dashboard/finance/receivable" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Ver detalles <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Por Cobrar</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white">
            {isSummaryLoading ? '...' : <AnimatedCounter value={summary?.total_receivables || 0} prefix="$" />}
          </p>
        </div>

        {/* Cash in Session */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <Banknote className="h-5 w-5 text-emerald-600" />
            </div>
            {summary?.session_active ? (
              <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                ABIERTA
              </span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-500 dark:bg-gray-800 px-2 py-0.5 rounded-full font-bold">
                CERRADA
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">En Caja Hoy</p>
          <p className="text-3xl font-black text-emerald-600">
            {isSummaryLoading ? '...' : <AnimatedCounter value={summary?.cash_in_session || 0} prefix="$" />}
          </p>
        </div>

        {/* Overdue Amount */}
        <div className={cn(
          "rounded-2xl p-5 border shadow-sm hover:shadow-lg transition-shadow",
          (summary?.overdue_amount || 0) > 0
            ? "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800"
            : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center",
              (summary?.overdue_amount || 0) > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-gray-100 dark:bg-gray-800"
            )}>
              <AlertTriangle className={cn("h-5 w-5", (summary?.overdue_amount || 0) > 0 ? "text-red-600" : "text-gray-400")} />
            </div>
            {(summary?.overdue_amount || 0) > 0 && (
              <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                ¡ALERTA!
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Vencido</p>
          <p className={cn("text-3xl font-black", (summary?.overdue_amount || 0) > 0 ? "text-red-600" : "text-gray-400")}>
            {isSummaryLoading ? '...' : <AnimatedCounter value={summary?.overdue_amount || 0} prefix="$" />}
          </p>
        </div>

        {/* Morosos Count */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Clientes Morosos</p>
          <p className="text-3xl font-black text-purple-600">
            {isSummaryLoading ? '...' : <AnimatedCounter value={summary?.morosos_count || 0} decimals={0} />}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aging Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Antigüedad de Cartera
          </h3>
          
          {totalAging > 0 ? (
            <>
              <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={agingChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      stroke="none"
                    >
                      {agingChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white">${totalAging.toFixed(0)}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                {agingChartData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-500 dark:text-gray-400">{item.name}</span>
                    <span className="font-bold ml-auto">${item.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-emerald-400" />
                <p className="font-medium">Sin deudas pendientes</p>
              </div>
            </div>
          )}
        </div>

        {/* Morosos Panel */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Clientes Morosos
            </h3>
            {morosos && morosos.total_morosos > 0 && (
              <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full font-bold">
                ${morosos.total_at_risk.toFixed(2)} en riesgo
              </span>
            )}
          </div>
          
          {isMorososLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : morosos && morosos.morosos.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {morosos.morosos.slice(0, 5).map((moroso) => (
                <div 
                  key={moroso.customer_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{moroso.customer_name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {moroso.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {moroso.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-red-600">${moroso.total_debt.toFixed(2)}</p>
                    <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                      {moroso.days_overdue}d
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-emerald-400" />
                <p className="font-medium">Sin clientes morosos</p>
                <p className="text-sm">¡Excelente gestión de cobranza!</p>
              </div>
            </div>
          )}
          
          <Link 
            href="/dashboard/finance/receivable" 
            className="flex items-center justify-center gap-2 mt-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-sm font-medium transition-colors"
          >
            Ver todas las cuentas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Cash Session Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-600" />
            Sesión de Caja
          </h3>
          
          {currentSession ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Código</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{currentSession.session_code}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Esperado USD</p>
                  <p className="text-lg font-black text-blue-600">${Number(currentSession.expected_amount).toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Esperado VES</p>
                  <p className="text-lg font-black text-emerald-600">Bs. {Number(currentSession.expected_amount_ves).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Real USD</Label>
                  <Input
                    type="number"
                    placeholder="$0.00"
                    value={actualAmount}
                    onChange={(e) => setActualAmount(e.target.value)}
                    className="h-10 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Real VES</Label>
                  <Input
                    type="number"
                    placeholder="Bs. 0.00"
                    value={actualAmountVES}
                    onChange={(e) => setActualAmountVES(e.target.value)}
                    className="h-10 font-bold"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleCloseSession}
                variant="destructive"
                className="w-full h-12 bg-red-600 hover:bg-red-700 font-bold"
                disabled={isSessionLoading || (!actualAmount && !actualAmountVES)}
              >
                Cerrar Caja
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">No hay caja abierta</p>
              <Button
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => window.location.href = '/dashboard/finance/cash-open'}
              >
                Abrir Caja <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          href="/dashboard/finance/receivable"
          className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 transition-colors group"
        >
          <div className="h-12 w-12 bg-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">Cuentas por Cobrar</p>
            <p className="text-sm text-gray-500">Gestionar créditos y abonos</p>
          </div>
          <ArrowRight className="h-5 w-5 text-purple-600 ml-auto" />
        </Link>
        
        <Link 
          href="/dashboard/finance/expenses"
          className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-800 transition-colors group"
        >
          <div className="h-12 w-12 bg-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">Gastos Operativos</p>
            <p className="text-sm text-gray-500">Control de egresos</p>
          </div>
          <ArrowRight className="h-5 w-5 text-orange-600 ml-auto" />
        </Link>
        
        <Link 
          href="/dashboard/reports"
          className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 transition-colors group"
        >
          <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">Reportes</p>
            <p className="text-sm text-gray-500">Análisis financiero</p>
          </div>
          <ArrowRight className="h-5 w-5 text-blue-600 ml-auto" />
        </Link>
      </div>
    </div>
  )
}
