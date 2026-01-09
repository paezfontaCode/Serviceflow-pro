'use client'

import { use, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { purchaseService, PurchaseOrder } from '@/lib/purchaseService'
import { 
  FileText, 
  ArrowLeft, 
  Calendar, 
  User, 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Truck,
  Loader2,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export default function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const purchaseId = parseInt(id)
  
  const queryClient = useQueryClient()

  const { data: purchase, isLoading } = useQuery({
    queryKey: ['purchase', purchaseId],
    queryFn: () => purchaseService.getPurchase(purchaseId)
  })

  const receiveMutation = useMutation({
    mutationFn: () => purchaseService.receivePurchase(purchaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase', purchaseId] })
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
    }
  })

  const cancelMutation = useMutation({
    mutationFn: () => purchaseService.cancelPurchase(purchaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase', purchaseId] })
    }
  })

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'received': return { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Recibido' }
      case 'cancelled': return { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Cancelado' }
      case 'ordered': return { color: 'bg-blue-100 text-blue-700', icon: Truck, label: 'En camino / Pedido' }
      default: return { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Borrador / Pendiente' }
    }
  }

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )

  if (!purchase) return (
    <div className="p-8 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold">Orden no encontrada</h2>
      <Link href="/dashboard/inventory/purchases" className="text-blue-600 hover:underline mt-4 inline-block">
        Volver a la lista
      </Link>
    </div>
  )

  const status = getStatusConfig(purchase.status)
  const StatusIcon = status.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inventory/purchases" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Orden de Compra #{purchase.id.toString().padStart(5, '0')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Proveedor: <span className="font-bold">{purchase.supplier_name}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {purchase.status !== 'received' && purchase.status !== 'cancelled' && (
            <>
              <button
                onClick={() => { if(confirm('¿Seguro que deseas cancelar esta orden?')) cancelMutation.mutate() }}
                className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-2"
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Cancelar Orden
              </button>
              <button
                onClick={() => { if(confirm('¿Marcar como recibida? Esto actualizará tu inventario.')) receiveMutation.mutate() }}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 shadow-sm"
                disabled={receiveMutation.isPending}
              >
                {receiveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                Recibir Stock
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Información de la Orden</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-2"><Clock className="h-4 w-4" /> Estado</span>
                <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1", status.color)}>
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-2"><Calendar className="h-4 w-4" /> Creada</span>
                <span className="font-medium">{format(new Date(purchase.created_at), 'dd/MM/yyyy')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-2"><User className="h-4 w-4" /> Responsable</span>
                <span className="font-medium">{purchase.username}</span>
              </div>
              {purchase.expected_date && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Expectativa de llegada</span>
                  <span className="font-medium">{format(new Date(purchase.expected_date), 'dd/MM/yyyy')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Resumen Financiero</h3>
            <div className="text-center py-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Monto Total</div>
              <div className="text-3xl font-black text-blue-600">
                ${Number(purchase.total_amount_usd).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white">Productos de la Orden</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-6 py-3 font-medium">Producto</th>
                    <th className="px-6 py-3 font-medium text-center">Cant.</th>
                    <th className="px-6 py-3 font-medium text-right">Costo Unit.</th>
                    <th className="px-6 py-3 font-medium text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {purchase.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-white">{item.product_name}</div>
                        <div className="text-[10px] text-gray-500">ID: #{item.product_id}</div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-right">
                        ${Number(item.unit_cost_usd).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold">
                        ${Number(item.subtotal_usd).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {purchase.notes && (
            <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/30">
              <h4 className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-sm mb-2">
                <FileText className="h-4 w-4" /> Observaciones
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                {purchase.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
