'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financeService, CustomerPaymentCreate, AccountReceivable } from '@/lib/financeService'
import { useFinanceStore } from '@/store/useFinanceStore'
import { 
  DollarSign, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  X, 
  Loader2, 
  Users, 
  Phone, 
  ChevronDown,
  ChevronUp,
  ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  partial: { label: 'Parcial', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: AlertCircle },
  paid: { label: 'Pagado', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
  overdue: { label: 'Vencido', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertCircle }
}

interface GroupedCustomer {
  customer_id: number
  customer_name: string
  total_debt: number
  paid_amount: number
  balance: number
  accounts: AccountReceivable[]
}

export default function AccountsReceivablePage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCustomer, setExpandedCustomer] = useState<number | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  
  const queryClient = useQueryClient()
  const exchangeRate = useFinanceStore(state => state.exchangeRate)

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts-receivable', statusFilter],
    queryFn: () => financeService.getAccountsReceivable({ status: statusFilter || undefined })
  })

  // Group accounts by customer
  const groupedByCustomer = useMemo(() => {
    if (!accounts) return []
    
    const groups: Record<number, GroupedCustomer> = {}
    
    accounts.forEach((account: AccountReceivable) => {
      const cid = account.customer_id
      if (!groups[cid]) {
        groups[cid] = {
          customer_id: cid,
          customer_name: account.customer_name || `Cliente #${cid}`,
          total_debt: 0,
          paid_amount: 0,
          balance: 0,
          accounts: []
        }
      }
      groups[cid].total_debt += Number(account.total_amount)
      groups[cid].paid_amount += Number(account.paid_amount || 0)
      groups[cid].balance += Number(account.balance || 0)
      groups[cid].accounts.push(account)
    })
    
    return Object.values(groups).sort((a, b) => b.balance - a.balance)
  }, [accounts])

  // Filter by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedByCustomer
    const query = searchQuery.toLowerCase()
    return groupedByCustomer.filter(g => 
      g.customer_name.toLowerCase().includes(query) ||
      g.customer_id.toString().includes(query)
    )
  }, [groupedByCustomer, searchQuery])

  // Summary stats
  const totalReceivables = groupedByCustomer.reduce((sum, g) => sum + g.balance, 0)
  const totalCustomers = groupedByCustomer.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/finance"
            className="h-10 w-10 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center transition-colors text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">Cuentas por Cobrar</h1>
            <p className="text-gray-400">Gestiona créditos y abonos de clientes</p>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-bold">Total por Cobrar</p>
            <p className="text-2xl font-black text-red-500 drop-shadow-sm">${totalReceivables.toFixed(2)}</p>
          </div>
          <div className="h-12 w-px bg-white/10" />
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-bold">Clientes</p>
            <p className="text-2xl font-black text-white">{totalCustomers}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            placeholder="Buscar por cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none text-white placeholder:text-gray-600"
          />
        </div>
        
        {/* Status Filters */}
        <div className="flex gap-2">
          {['', 'pending', 'partial', 'paid', 'overdue'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all backdrop-blur-md border",
                statusFilter === status
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 border-blue-500/50"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 border-white/10 hover:text-white"
              )}
            >
              {status === '' ? 'Todos' : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-16 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <p className="text-xl font-bold text-white">Sin resultados</p>
            <p className="text-gray-500">No hay cuentas por cobrar que coincidan</p>
          </div>
        ) : (
          filteredGroups.map((customer) => {
            const isExpanded = expandedCustomer === customer.customer_id
            const hasOverdue = customer.accounts.some(a => a.status === 'overdue')
            
            return (
              <div 
                key={customer.customer_id}
                className={cn(
                  "bg-white/5 backdrop-blur-md rounded-2xl border overflow-hidden transition-all",
                  hasOverdue 
                    ? "border-red-500/30 shadow-lg shadow-red-500/5" 
                    : "border-white/10"
                )}
              >
                {/* Customer Header */}
                <button
                  onClick={() => setExpandedCustomer(isExpanded ? null : customer.customer_id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center border",
                      hasOverdue 
                        ? "bg-red-500/10 border-red-500/20" 
                        : "bg-blue-500/10 border-blue-500/20"
                    )}>
                      <Users className={cn("h-6 w-6", hasOverdue ? "text-red-400" : "text-blue-400")} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white text-lg">{customer.customer_name}</p>
                      <p className="text-sm text-gray-500">{customer.accounts.length} cuenta(s) activa(s)</p>
                    </div>
                    {hasOverdue && (
                      <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold uppercase">
                        Moroso
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase font-bold">Saldo</p>
                      <p className="text-xl font-black text-red-500">${customer.balance.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Bs. {(customer.balance * exchangeRate).toFixed(2)}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </button>
                
                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-white/10 bg-black/20 p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500 text-xs uppercase">
                          <th className="text-left py-2 px-3">ID</th>
                          <th className="text-left py-2 px-3">Monto</th>
                          <th className="text-left py-2 px-3">Pagado</th>
                          <th className="text-left py-2 px-3">Saldo</th>
                          <th className="text-left py-2 px-3">Vencimiento</th>
                          <th className="text-left py-2 px-3">Estado</th>
                          <th className="text-right py-2 px-3">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {customer.accounts.map((account) => {
                          const StatusIcon = STATUS_CONFIG[account.status as keyof typeof STATUS_CONFIG]?.icon || Clock
                          return (
                            <tr key={account.id} className="hover:bg-white/5 transition-colors text-gray-300">
                              <td className="py-3 px-3 font-medium">#{account.id}</td>
                              <td className="py-3 px-3">${Number(account.total_amount).toFixed(2)}</td>
                              <td className="py-3 px-3 text-emerald-400">${Number(account.paid_amount || 0).toFixed(2)}</td>
                              <td className="py-3 px-3 font-bold text-red-400">${Number(account.balance).toFixed(2)}</td>
                              <td className="py-3 px-3 text-gray-500">{new Date(account.due_date).toLocaleDateString()}</td>
                              <td className="py-3 px-3">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1 border",
                                  STATUS_CONFIG[account.status as keyof typeof STATUS_CONFIG]?.color
                                )}>
                                  <StatusIcon className="h-3 w-3" />
                                  {STATUS_CONFIG[account.status as keyof typeof STATUS_CONFIG]?.label}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                {account.status !== 'paid' && (
                                  <button
                                    onClick={() => {
                                      setSelectedAccount(account)
                                      setIsPaymentModalOpen(true)
                                    }}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-blue-500/20"
                                  >
                                    Registrar Pago
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedAccount && (
        <PaymentModal 
          account={selectedAccount} 
          isOpen={isPaymentModalOpen} 
          onClose={() => {
            setIsPaymentModalOpen(false)
            setSelectedAccount(null)
          }} 
        />
      )}
    </div>
  )
}

function PaymentModal({ account, isOpen, onClose }: { account: any, isOpen: boolean, onClose: () => void }) {
  const [amount, setAmount] = useState(account.balance)
  const [method, setMethod] = useState('cash')
  const [currency, setCurrency] = useState('USD')
  const [notes, setNotes] = useState('')
  const exchangeRate = useFinanceStore(state => state.exchangeRate)
  
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: (data: CustomerPaymentCreate) => financeService.registerPayment(account.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] })
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] })
      queryClient.invalidateQueries({ queryKey: ['morosos'] })
      onClose()
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error al registrar pago")
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      amount_usd: Number(amount),
      payment_method: method,
      currency: currency,
      notes: notes
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/90 backdrop-blur-3xl rounded-3xl max-w-md w-full shadow-2xl border border-white/10 p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Registrar Abono</h3>
          <button onClick={onClose}><X className="h-6 w-6 text-gray-400 hover:text-white transition-colors" /></button>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 p-4 rounded-2xl mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Deuda Total:</span>
            <span className="font-medium text-white">${Number(account.total_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Pagado:</span>
            <span className="font-medium text-emerald-400">${Number(account.paid_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t border-red-500/20 pt-2">
            <span className="text-white">Saldo Pendiente:</span>
            <div className="text-right">
              <div className="text-red-500 text-xl">${Number(account.balance).toFixed(2)}</div>
              <div className="text-red-400 text-sm font-medium">Bs. {(Number(account.balance) * exchangeRate).toFixed(2)}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Monto a Pagar (USD)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                max={account.balance}
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Método</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none"
              >
                <option value="cash" className="bg-gray-900">Efectivo</option>
                <option value="card" className="bg-gray-900">Tarjeta</option>
                <option value="transfer" className="bg-gray-900">Transferencia</option>
                <option value="mobile_payment" className="bg-gray-900">Pago Móvil</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Moneda</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none"
              >
                <option value="USD" className="bg-gray-900">USD</option>
                <option value="VES" className="bg-gray-900">VES</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500/50 outline-none resize-none"
              rows={2}
              placeholder="Referencia, observaciones..."
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20"
          >
            {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
            Confirmar Pago
          </button>
        </form>
      </div>
    </div>
  )
}
