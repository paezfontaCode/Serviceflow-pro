'use client'

import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import posService from '@/lib/posService'
import customerService from '@/lib/customerService'
import { useCartStore } from '@/store/useCartStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { X, CreditCard, Banknote, Smartphone, Loader2, User } from 'lucide-react'
import { SearchableSelect } from '@/components/ui/SearchableSelect'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (saleId: number) => void
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo', icon: Banknote },
  { value: 'card', label: 'Tarjeta', icon: CreditCard },
  { value: 'transfer', label: 'Transferencia', icon: Smartphone },
  { value: 'credit', label: 'Crédito', icon: CreditCard }
]

export default function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentCurrency, setPaymentCurrency] = useState('USD')
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>()
  const [notes, setNotes] = useState('')
  const { items, getTotalUSD, clearCart } = useCartStore()
  const exchangeRate = useFinanceStore(state => state.exchangeRate)
  const queryClient = useQueryClient()

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(),
    enabled: isOpen
  })

  const createSaleMutation = useMutation({
    mutationFn: posService.createSale,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      clearCart()
      onSuccess(data.id)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation for credit sales
    if (paymentMethod === 'credit' && !selectedCustomerId) {
      alert('Las ventas a crédito requieren seleccionar un cliente registrado.')
      return
    }
    
    createSaleMutation.mutate({
      customer_id: selectedCustomerId,
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      })),
      payment_method: paymentMethod,
      payment_currency: paymentMethod === 'cash' ? paymentCurrency : 'USD',
      notes: notes || undefined
    })
  }

  const totalUSD = getTotalUSD()
  const totalVES = totalUSD * exchangeRate

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Procesar Pago</h2>
          <button
            onClick={onClose}
            disabled={createSaleMutation.isPending}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Artículos</span>
              <span className="font-medium text-gray-900 dark:text-white">{items.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total USD</span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                ${totalUSD.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total VES</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Bs. {totalVES.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cliente (Opcional)
            </label>
            <SearchableSelect
              options={customers?.map((c: any) => ({
                value: c.id,
                label: c.name,
                subLabel: c.dni ? `CI/RIF: ${c.dni}` : undefined
              })) || []}
              value={selectedCustomerId}
              onChange={(val) => setSelectedCustomerId(val ? Number(val) : undefined)}
              placeholder="Buscar cliente por nombre o CI..."
              className="w-full"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Método de Pago
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      paymentMethod === method.value
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${
                      paymentMethod === method.value ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <span className={`text-xs font-medium ${
                      paymentMethod === method.value 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {method.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Currency Selection (Only for cash) */}
          {paymentMethod === 'cash' && (
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Moneda de Pago
              </label>
              <div className="flex gap-2">
                {['USD', 'VES'].map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setPaymentCurrency(curr)}
                    className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${
                      paymentCurrency === curr
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {curr === 'USD' ? '$ Dólares' : 'Bs. Bolívares'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Agregar notas sobre la venta..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
            />
          </div>

          {/* Error Message */}
          {createSaleMutation.isError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-xs text-red-600 dark:text-red-400">
                Error: {(createSaleMutation.error as any)?.response?.data?.detail || 'Error al procesar la venta'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={createSaleMutation.isPending}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createSaleMutation.isPending}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createSaleMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar Venta'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
