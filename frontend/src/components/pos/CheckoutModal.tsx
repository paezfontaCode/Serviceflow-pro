'use client'

import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import posService from '@/lib/posService'
import repairService from '@/lib/repairService'
import customerService from '@/lib/customerService'
import { useCartStore } from '@/store/useCartStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { X, CreditCard, Banknote, Smartphone, Loader2, Package, Wrench, CheckCircle, AlertCircle } from 'lucide-react'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { cn } from '@/lib/utils'

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
  const [isProcessing, setIsProcessing] = useState(false)
  const [processStatus, setProcessStatus] = useState<{ products?: 'pending' | 'success' | 'error'; repairs?: 'pending' | 'success' | 'error' }>({})
  
  const { items, getTotalUSD, clearCart, getProductItems, getRepairItems, hasProducts, hasRepairs } = useCartStore()
  const exchangeRate = useFinanceStore(state => state.exchangeRate)
  const queryClient = useQueryClient()

  const productItems = getProductItems()
  const repairItems = getRepairItems()
  const productTotal = productItems.reduce((sum, item) => sum + (item.price_usd * item.quantity), 0)
  const repairTotal = repairItems.reduce((sum, item) => sum + item.price_usd, 0)

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(),
    enabled: isOpen
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation for credit sales
    if (paymentMethod === 'credit' && !selectedCustomerId) {
      alert('Las ventas a crédito requieren seleccionar un cliente registrado.')
      return
    }

    setIsProcessing(true)
    setProcessStatus({})
    let saleId: number | null = null

    try {
      // Process product sale first if products exist
      if (hasProducts()) {
        setProcessStatus(prev => ({ ...prev, products: 'pending' }))
        try {
          const saleResponse = await posService.createSale({
            customer_id: selectedCustomerId,
            items: productItems.map(item => ({
              product_id: item.product_id!,
              quantity: item.quantity
            })),
            payment_method: paymentMethod,
            payment_currency: paymentMethod === 'cash' ? paymentCurrency : 'USD',
            notes: notes || undefined
          })
          saleId = saleResponse.id
          setProcessStatus(prev => ({ ...prev, products: 'success' }))
        } catch (error) {
          setProcessStatus(prev => ({ ...prev, products: 'error' }))
          throw error
        }
      }

      // Process repair payments
      if (hasRepairs()) {
        setProcessStatus(prev => ({ ...prev, repairs: 'pending' }))
        try {
          for (const repairItem of repairItems) {
            await repairService.recordPayment(repairItem.repair_id!, {
              amount: repairItem.price_usd,
              payment_method: paymentMethod,
              notes: repairItem.is_partial ? `Abono parcial: $${repairItem.price_usd}` : `Pago completo`,
            })
          }
          setProcessStatus(prev => ({ ...prev, repairs: 'success' }))
        } catch (error) {
          setProcessStatus(prev => ({ ...prev, repairs: 'error' }))
          throw error
        }
      }

      // Success!
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['repairs'] })
      queryClient.invalidateQueries({ queryKey: ['repairs-for-payment'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      
      clearCart()
      onSuccess(saleId || 0)
    } catch (error: any) {
      console.error('Checkout error:', error)
      alert(error?.response?.data?.detail || 'Error al procesar el pago')
    } finally {
      setIsProcessing(false)
    }
  }

  const totalUSD = getTotalUSD()
  const totalVES = totalUSD * exchangeRate

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Procesar Pago</h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Summary by Type */}
          <div className="space-y-3">
            {hasProducts() && (
              <div className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                processStatus.products === 'success' 
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : processStatus.products === 'error'
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
              )}>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Productos</p>
                    <p className="text-xs text-gray-500">{productItems.length} artículo(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-600">${productTotal.toFixed(2)}</span>
                  {processStatus.products === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {processStatus.products === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                  {processStatus.products === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                </div>
              </div>
            )}

            {hasRepairs() && (
              <div className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                processStatus.repairs === 'success' 
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : processStatus.repairs === 'error'
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
              )}>
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Servicios</p>
                    <p className="text-xs text-gray-500">{repairItems.length} reparación(es)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-orange-600">${repairTotal.toFixed(2)}</span>
                  {processStatus.repairs === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {processStatus.repairs === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                  {processStatus.repairs === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-orange-500" />}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total a Cobrar</span>
                <span className="text-2xl font-bold">${totalUSD.toFixed(2)}</span>
              </div>
              <p className="text-blue-100 text-sm mt-1">Bs. {totalVES.toFixed(2)}</p>
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
                    disabled={isProcessing}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      paymentMethod === method.value
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } disabled:opacity-50`}
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
                    disabled={isProcessing}
                    className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${
                      paymentCurrency === curr
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    } disabled:opacity-50`}
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
              disabled={isProcessing}
              placeholder="Agregar notas..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm disabled:opacity-50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing || items.length === 0}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar Pago'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

