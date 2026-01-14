'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import repairService, { Repair } from '@/lib/repairService'
import { useCartStore } from '@/store/useCartStore'
import { Search, Wrench, Plus, CheckCircle, Clock, DollarSign, User, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  received: { label: 'Recibido', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
  in_progress: { label: 'En Progreso', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' },
  ready: { label: 'Listo', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
  delivered: { label: 'Entregado', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' }
}

export default function RepairSelector() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ready')
  const addRepair = useCartStore(state => state.addRepair)
  const items = useCartStore(state => state.items)

  const { data: repairs, isLoading } = useQuery({
    queryKey: ['repairs-for-payment', statusFilter],
    queryFn: () => repairService.getRepairs(statusFilter || undefined)
  })

  // Filter by search
  const filteredRepairs = (repairs || []).filter((repair: Repair) => {
    const matchesSearch = !searchQuery || 
      repair.device_model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repair.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      repair.id.toString().includes(searchQuery)
    return matchesSearch
  })

  const handleAddToCart = (repair: Repair) => {
    const totalCost = Number(repair.estimated_cost_usd || 0) + Number(repair.parts_cost_usd || 0)
    const paidAmount = Number(repair.paid_amount_usd || 0)
    const remainingBalance = Math.max(0, totalCost - paidAmount)

    addRepair({
      repair_id: repair.id,
      name: `Reparación #${repair.id} - ${repair.device_model}`,
      description: repair.problem_description,
      price_usd: remainingBalance,
      customer_name: repair.customer_name
    })
  }

  const isInCart = (repairId: number) => {
    return items.some(item => item.repair_id === repairId)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'ready', label: 'Listo para Cobrar', icon: CheckCircle },
          { value: 'in_progress', label: 'En Progreso', icon: Clock },
          { value: '', label: 'Todos', icon: Wrench }
        ].map((status) => (
          <button
            key={status.value}
            onClick={() => setStatusFilter(status.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              statusFilter === status.value
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            <status.icon className="h-4 w-4" />
            {status.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Buscar por # orden, equipo o cliente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Repairs List */}
      <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
        {filteredRepairs.length > 0 ? (
          filteredRepairs.map((repair: Repair) => {
            const statusInfo = STATUS_CONFIG[repair.status as keyof typeof STATUS_CONFIG]
            const totalCost = Number(repair.estimated_cost_usd || 0) + Number(repair.parts_cost_usd || 0)
            const paidAmount = Number(repair.paid_amount_usd || 0)
            const remainingBalance = Math.max(0, totalCost - paidAmount)
            const inCart = isInCart(repair.id)

            return (
              <div
                key={repair.id}
                className={cn(
                  "bg-white dark:bg-gray-900 border rounded-xl p-4 transition-all",
                  inCart 
                    ? "border-blue-500 ring-2 ring-blue-500/20" 
                    : "border-gray-200 dark:border-gray-800 hover:shadow-md"
                )}
              >
                <div className="flex justify-between items-start gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900 dark:text-white">
                        #{repair.id}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", statusInfo?.color)}>
                        {statusInfo?.label}
                      </span>
                    </div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 truncate">
                      {repair.device_model}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <User className="h-3 w-3" />
                      <span>{repair.customer_name || 'Particular'}</span>
                    </div>
                  </div>

                  {/* Right: Price & Action */}
                  <div className="text-right flex flex-col items-end gap-2">
                    <div>
                      {paidAmount > 0 && (
                        <p className="text-[10px] text-gray-400 line-through">
                          Total: ${totalCost.toFixed(2)}
                        </p>
                      )}
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        ${remainingBalance.toFixed(2)}
                      </p>
                      {paidAmount > 0 && (
                        <p className="text-[10px] text-green-600 font-medium">
                          Abonado: ${paidAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(repair)}
                      disabled={inCart || remainingBalance === 0}
                      className={cn(
                        "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                        inCart
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default"
                          : remainingBalance === 0
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                      )}
                    >
                      {inCart ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          En Carrito
                        </>
                      ) : remainingBalance === 0 ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Pagado
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Cobrar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <AlertCircle className="h-12 w-12 mb-3 text-gray-300" />
            <p className="font-medium">No hay reparaciones</p>
            <p className="text-sm text-gray-400">
              {statusFilter === 'ready' ? 'Ninguna reparación lista para cobrar' : 'No se encontraron reparaciones'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
