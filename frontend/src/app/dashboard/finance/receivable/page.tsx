'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financeService, CustomerPaymentCreate } from '@/lib/financeService'
import { useFinanceStore } from '@/store/useFinanceStore'
import { DollarSign, Search, Calendar, CheckCircle, Clock, AlertCircle, Plus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400', icon: Clock },
  partial: { label: 'Parcial', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', icon: AlertCircle },
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle },
  overdue: { label: 'Vencido', color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', icon: AlertCircle }
}

export default function AccountsReceivablePage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  
  const queryClient = useQueryClient()
  const exchangeRate = useFinanceStore(state => state.exchangeRate)

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts-receivable', statusFilter],
    queryFn: () => financeService.getAccountsReceivable({ status: statusFilter || undefined })
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cuentas por Cobrar</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestiona créditos y abonos de clientes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['', 'pending', 'partial', 'paid', 'overdue'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              statusFilter === status
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            {status === '' ? 'Todos' : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-3 font-medium">ID / Cliente</th>
                <th className="px-6 py-3 font-medium">Monto Total</th>
                <th className="px-6 py-3 font-medium">Pagado (USD)</th>
                <th className="px-6 py-3 font-medium">Saldo (USD)</th>
                <th className="px-6 py-3 font-medium">Saldo (VES)</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                  </td>
                </tr>
              ) : accounts?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No hay cuentas por cobrar registradas
                  </td>
                </tr>
              ) : (
                accounts?.map((account: any) => {
                  const StatusIcon = STATUS_CONFIG[account.status as keyof typeof STATUS_CONFIG]?.icon || Clock
                  return (
                    <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">#{account.id}</div>
                        <div className="text-xs text-gray-500">Cliente {account.customer_id}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">${Number(account.total_amount).toFixed(2)}</td>
                      <td className="px-6 py-4 text-green-600">${Number(account.paid_amount).toFixed(2)}</td>
                      <td className="px-6 py-4 font-medium text-red-600">
                        ${Number(account.balance).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-bold text-red-600">
                        Bs. {(Number(account.balance) * exchangeRate).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit gap-1", STATUS_CONFIG[account.status as keyof typeof STATUS_CONFIG]?.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {STATUS_CONFIG[account.status as keyof typeof STATUS_CONFIG]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {account.status !== 'paid' && (
                          <button
                            onClick={() => {
                              setSelectedAccount(account)
                              setIsPaymentModalOpen(true)
                            }}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg text-xs font-medium transition-colors"
                          >
                            Registrar Pago
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
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
  const [notes, setNotes] = useState('')
  const exchangeRate = useFinanceStore(state => state.exchangeRate)
  
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: (data: CustomerPaymentCreate) => financeService.registerPayment(account.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] })
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
      notes: notes
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Registrar Abono</h3>
          <button onClick={onClose}><X className="h-6 w-6 text-gray-400" /></button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Deuda Total:</span>
            <span className="font-medium dark:text-white">${Number(account.total_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Pagado:</span>
            <span className="font-medium text-green-600">${Number(account.paid_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
            <span className="text-gray-900 dark:text-white">Saldo Pendiente:</span>
            <div className="text-right">
              <div className="text-red-600 text-xl">${Number(account.balance).toFixed(2)}</div>
              <div className="text-red-500 text-sm font-medium">Bs. {(Number(account.balance) * exchangeRate).toFixed(2)}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto a Pagar (USD)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                max={account.balance}
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Método de Pago</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
              <option value="mobile_payment">Pago Móvil</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              rows={2}
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
            Confirmar Pago
          </button>
        </form>
      </div>
    </div>
  )
}
