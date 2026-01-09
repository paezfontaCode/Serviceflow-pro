'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import repairService, { RepairItem } from '@/lib/repairService'
import posService, { Product } from '@/lib/posService'
import { X, Package, Plus, Trash2, Loader2, Search, DollarSign } from 'lucide-react'

interface RepairPartsModalProps {
  repairId: number
  isOpen: boolean
  onClose: () => void
}

export default function RepairPartsModal({ repairId, isOpen, onClose }: RepairPartsModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  
  const queryClient = useQueryClient()

  // Fetch repair items
  const { data: items, isLoading: loadingItems } = useQuery({
    queryKey: ['repair-items', repairId],
    queryFn: () => repairService.getRepairItems(repairId),
    enabled: isOpen
  })

  // Fetch products for selection
  const { data: products } = useQuery({
    queryKey: ['products', searchQuery],
    queryFn: () => posService.getProducts({ search: searchQuery || undefined, in_stock: true, limit: 20 }),
    enabled: isOpen && searchQuery.length > 0
  })

  // Add item mutation
  const addMutation = useMutation({
    mutationFn: () => repairService.addRepairItem(repairId, {
      product_id: selectedProduct!.id,
      quantity
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-items', repairId] })
      queryClient.invalidateQueries({ queryKey: ['repairs'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setSelectedProduct(null)
      setQuantity(1)
      setSearchQuery('')
    }
  })

  // Remove item mutation
  const removeMutation = useMutation({
    mutationFn: (itemId: number) => repairService.removeRepairItem(repairId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-items', repairId] })
      queryClient.invalidateQueries({ queryKey: ['repairs'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })

  const totalPartsCost = items?.reduce((sum, item) => sum + (Number(item.subtotal_usd) || 0), 0) || 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              Repuestos - Orden #{repairId}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Agregar o quitar repuestos de esta reparación</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add Part Section */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Agregar Repuesto</h3>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar producto por nombre o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Search Results */}
            {products && products.length > 0 && !selectedProduct && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-40 overflow-y-auto">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product)
                      setSearchQuery('')
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sku} • Stock: {product.inventory_quantity}</p>
                    </div>
                    <span className="font-semibold text-green-600">${Number(product.price_usd).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Product */}
            {selectedProduct && (
              <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-3 rounded-lg border border-orange-300 dark:border-orange-700">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{selectedProduct.name}</p>
                  <p className="text-sm text-gray-500">${Number(selectedProduct.price_usd).toFixed(2)} c/u</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Cant:</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct.inventory_quantity || 99}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-lg text-center bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={() => addMutation.mutate()}
                  disabled={addMutation.isPending}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Agregar
                </button>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Current Parts List */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Repuestos Utilizados</h3>
            
            {loadingItems ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : items && items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} x ${Number(item.unit_cost_usd).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${Number(item.subtotal_usd).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeMutation.mutate(item.id)}
                        disabled={removeMutation.isPending}
                        className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay repuestos agregados</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-gray-600 dark:text-gray-400">Total Repuestos:</span>
              <span className="font-bold text-gray-900 dark:text-white">${totalPartsCost.toFixed(2)}</span>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
