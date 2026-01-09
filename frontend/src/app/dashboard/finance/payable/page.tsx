'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apService, AccountsPayable, APPayment } from '@/lib/apService'
import { purchaseService } from '@/lib/purchaseService'
import { 
  Plus, 
  Search, 
  Loader2, 
  X, 
  Building2, 
  Calendar, 
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function PayablePage() {
  const [selectedAp, setSelectedAp] = useState<AccountsPayable | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  
  const queryClient = useQueryClient()

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts-payable'],
    queryFn: () => apService.getAccountsPayable()
  })

  // To show supplier names, we might need suppliers
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => purchaseService.getSuppliers()
  })

  const paymentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: APPayment }) => apService.payAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] })
      queryClient.invalidateQueries({ queryKey: ['finance-session'] })
      setIsPaymentModalOpen(false)
      setSelectedAp(null)
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error al registrar pago")
    }
  })

  const handlePayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedAp) return
    
    const formData = new FormData(e.currentTarget)
    const data: APPayment = {
      amount_usd: Number(formData.get('amount_usd')),
      payment_method: formData.get('payment_method') as string
    }
    
    paymentMutation.mutate({ id: selectedAp.id, data })
  }

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'paid': return { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Pagado' }
      case 'partial': return { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Parcial' }
      default: return { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, label: 'Pendiente' }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
          <CreditCard className="h-6 w-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cuentas por Pagar</h1>
          <p className="text-gray-600 dark:text-gray-400">Control de deudas a proveedores por compras a crédito</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-3 font-medium">Proveedor / OC</th>
                <th className="px-6 py-3 font-medium">Vencimiento</th>
                <th className="px-6 py-3 font-medium">Total</th>
                <th className="px-6 py-3 font-medium">Pagado</th>
                <th className="px-6 py-3 font-medium">Saldo</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center">
                     <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-600" />
                   </td>
                </tr>
              ) : !accounts || accounts.length === 0 ? (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                     No hay cuentas por pagar registradas
                   </td>
                </tr>
              ) : (
                accounts.map((ap) => {
                  const supplier = suppliers?.find(s => s.id === ap.supplier_id)
                  const status = getStatusConfig(ap.status)
                  const StatusIcon = status.icon
                  
                  return (
                    <tr key={ap.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-white">{supplier?.name || `Proveedor #${ap.supplier_id}`}</div>
                        <div className="text-xs text-gray-500">OC-{ap.purchase_order_id?.toString().padStart(5, '0')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {format(new Date(ap.due_date), 'dd/MM/yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">${Number(ap.total_amount).toFixed(2)}</td>
                      <td className="px-6 py-4 text-green-600 font-medium">${Number(ap.paid_amount).toFixed(2)}</td>
                      <td className="px-6 py-4 font-black text-gray-900 dark:text-white">${Number(ap.balance).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {ap.status !== 'paid' && (
                          <button
                            onClick={() => { setSelectedAp(ap); setIsPaymentModalOpen(true) }}
                            className="text-orange-600 hover:text-orange-700 font-bold text-xs flex items-center gap-1 ml-auto"
                          >
                            Abonar <ArrowRight className="h-3 w-3" />
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
      {isPaymentModalOpen && selectedAp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Registrar Pago a Proveedor</h2>
              <button onClick={() => setIsPaymentModalOpen(false)}><X className="h-6 w-6 text-gray-400" /></button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="text-sm text-gray-500 mb-1">Saldo Pendiente</div>
              <div className="text-3xl font-black text-gray-900 dark:text-white">
                ${Number(selectedAp.balance).toFixed(2)}
              </div>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Monto a Pagar (USD) *</label>
                <input 
                  name="amount_usd" 
                  type="number" 
                  step="0.01" 
                  max={selectedAp.balance}
                  defaultValue={selectedAp.balance}
                  required 
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 text-lg font-bold" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Método de Pago *</label>
                <select name="payment_method" required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Zelle">Zelle</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" disabled={paymentMutation.isPending} className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-bold hover:bg-orange-700 flex justify-center items-center gap-2">
                  {paymentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
