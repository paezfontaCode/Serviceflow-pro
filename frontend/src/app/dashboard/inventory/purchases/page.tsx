'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { purchaseService, PurchaseOrder } from '@/lib/purchaseService'
import { InventoryNav } from '@/components/inventory/InventoryNav'
import { Plus, ShoppingCart, Loader2, Calendar, User, Building2, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: Clock },
  ordered: { label: 'Pedido', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', icon: ShoppingCart },
  received: { label: 'Recibido', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', icon: XCircle }
}

export default function PurchasesPage() {
  const queryClient = useQueryClient()

  const { data: purchases, isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => purchaseService.getPurchases()
  })

  const receiveMutation = useMutation({
    mutationFn: (id: number) => purchaseService.receivePurchase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error al recibir la orden")
    }
  })

  const handleReceive = (id: number) => {
    if (confirm('¿Confirmas que has recibido todos los productos de esta orden? El stock se actualizará automáticamente.')) {
      receiveMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <InventoryNav />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ordenes de Compra</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestiona el reabastecimiento de stock y pedidos a proveedores.</p>
        </div>
        <Link
          href="/dashboard/inventory/purchases/new"
          className="inline-flex items-center gap-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          <Plus className="h-5 w-5" />
          Nueva Compra
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-3 font-medium">Orden / Fecha</th>
                <th className="px-6 py-3 font-medium">Proveedor</th>
                <th className="px-6 py-3 font-medium">Total (USD)</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Usuario</th>
                <th className="px-6 py-3 font-right text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                  </td>
                </tr>
              ) : !purchases || purchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No hay ordenes de compra registradas
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => {
                  const status = STATUS_CONFIG[purchase.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft
                  const StatusIcon = status.icon

                  return (
                    <tr key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-white">OC-{purchase.id.toString().padStart(5, '0')}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(purchase.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {purchase.supplier_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        ${Number(purchase.total_amount_usd).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit gap-1", status.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        <div className="flex items-center gap-2 text-xs">
                          <User className="h-3 w-3" />
                          {purchase.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {purchase.status !== 'received' && purchase.status !== 'cancelled' && (
                            <button
                              onClick={() => handleReceive(purchase.id)}
                              disabled={receiveMutation.isPending}
                              className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              {receiveMutation.isPending && receiveMutation.variables === purchase.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Recibir Stock'
                              )}
                            </button>
                          )}
                          <Link 
                            href={`/dashboard/inventory/purchases/${purchase.id}`}
                            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Ver detalle"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
