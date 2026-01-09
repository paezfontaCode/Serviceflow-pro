'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { purchaseService, PurchaseOrderCreate, PurchaseItemCreate } from '@/lib/purchaseService'
import inventoryService from '@/lib/inventoryService'
import { InventoryNav } from '@/components/inventory/InventoryNav'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { Plus, Minus, ShoppingCart, Loader2, Search, Trash2, Save, ArrowLeft, Package } from 'lucide-react'

export default function NewPurchasePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null)
  const [items, setItems] = useState<PurchaseItemCreate[]>([])
  const [notes, setNotes] = useState('')
  const [expectedDate, setExpectedDate] = useState('')

  // Queries
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => purchaseService.getSuppliers()
  })

  const { data: products } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: () => inventoryService.getProducts({ limit: 100 })
  })

  // Mutation
  const createMutation = useMutation({
    mutationFn: (data: PurchaseOrderCreate) => purchaseService.createPurchase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      router.push('/dashboard/inventory/purchases')
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error al crear la orden de compra")
    }
  })

  const handleAddItem = (productId: number) => {
    const product = products?.find(p => p.id === productId)
    if (!product) return

    const existing = items.find(i => i.product_id === productId)
    if (existing) {
      setItems(items.map(i => i.product_id === productId ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setItems([...items, {
        product_id: product.id,
        quantity: 1,
        unit_cost_usd: Number(product.cost_usd) || 0
      }])
    }
  }

  const handleRemoveItem = (productId: number) => {
    setItems(items.filter(i => i.product_id !== productId))
  }

  const updateQuantity = (productId: number, val: number) => {
    setItems(items.map(i => i.product_id === productId ? { ...i, quantity: Math.max(1, val) } : i))
  }

  const updateCost = (productId: number, val: number) => {
    setItems(items.map(i => i.product_id === productId ? { ...i, unit_cost_usd: val } : i))
  }

  const totalAmount = items.reduce((acc, item) => acc + (item.quantity * item.unit_cost_usd), 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupplierId) return alert('Selecciona un proveedor')
    if (items.length === 0) return alert('Agrega al menos un producto')

    createMutation.mutate({
      supplier_id: selectedSupplierId,
      expected_date: expectedDate || undefined,
      notes,
      items
    })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nueva Orden de Compra</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Order Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Productos de la Orden</h3>
            
            {/* Product Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Buscar Producto</label>
              <div className="relative">
                <SearchableSelect
                  options={products?.map(p => ({ value: p.id, label: `${p.name} - SKU: ${p.sku || 'N/A'}` })) || []}
                  onChange={(val) => handleAddItem(Number(val))}
                  placeholder="Selecciona un producto para agregar..."
                />
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No hay productos en la orden</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {items.map((item) => {
                    const product = products?.find(p => p.id === item.product_id)
                    return (
                      <div key={item.product_id} className="py-4 flex items-center gap-4 text-sm">
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 dark:text-white">{product?.name}</div>
                          <div className="text-xs text-gray-500">SKU: {product?.sku || 'N/A'}</div>
                        </div>
                        
                        <div className="w-24">
                          <label className="text-[10px] text-gray-500 block mb-1">Costo (USD)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unit_cost_usd}
                            onChange={(e) => updateCost(item.product_id, Number(e.target.value))}
                            className="w-full text-center py-1.5 border rounded-lg dark:bg-gray-800 dark:border-gray-700 font-bold"
                          />
                        </div>

                        <div className="w-32 flex items-center border rounded-lg dark:border-gray-700 px-1 overflow-hidden">
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.product_id, Number(e.target.value))}
                            className="w-full text-center py-1.5 bg-transparent outline-none font-bold"
                          />
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="w-24 text-right font-bold text-gray-900 dark:text-white">
                          ${(item.quantity * item.unit_cost_usd).toFixed(2)}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.product_id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Supplier & Summary */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              Resumen de Orden
            </h3>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proveedor *</label>
                <SearchableSelect
                  options={suppliers?.map(s => ({ value: s.id, label: s.name })) || []}
                  value={selectedSupplierId || undefined}
                  onChange={(val) => setSelectedSupplierId(Number(val))}
                  placeholder="Selecciona proveedor..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Esperada</label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Instrucciones especiales..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-3">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal Items</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-black text-gray-900 dark:text-white">
                <span>Total Estimado</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              disabled={createMutation.isPending || items.length === 0}
              className="w-full mt-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Crear Orden de Compra
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
