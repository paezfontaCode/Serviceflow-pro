'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import inventoryService, { ProductFormData } from '@/lib/inventoryService'
import { Plus, Search, Package, Edit, Trash2, TrendingUp, TrendingDown, Loader2, X, Download, Upload, History } from 'lucide-react'
import ImportModal from '@/components/inventory/ImportModal'
import { InventoryNav } from '@/components/inventory/InventoryNav'
import { cn } from '@/lib/utils'

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<any>(null)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price_usd: 0,
    cost_usd: 0,
    initial_stock: 0
  })

  const queryClient = useQueryClient()

  const { data: products, isLoading } = useQuery({
    queryKey: ['inventory-products', searchQuery, selectedCategory],
    queryFn: () => inventoryService.getProducts({
      search: searchQuery || undefined,
      category_id: selectedCategory,
      limit: 100
    })
  })

  // ... queries and mutations remain the same ...
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => inventoryService.getCategories()
  })

  const createMutation = useMutation({
    mutationFn: inventoryService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
      setIsFormOpen(false)
      resetForm()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductFormData> }) =>
      inventoryService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
      setIsFormOpen(false)
      resetForm()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: inventoryService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
    }
  })

  const adjustMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { quantity: number; reason: string } }) =>
      inventoryService.adjustStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] })
      setIsAdjustOpen(false)
      setSelectedProductForAdjust(null)
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error al ajustar stock")
    }
  })

  const resetForm = () => {
    setFormData({ name: '', price_usd: 0, cost_usd: 0, initial_stock: 0 })
    setEditingProduct(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description,
      price_usd: Number(product.price_usd),
      cost_usd: Number(product.cost_usd),
      category_id: product.category_id,
      brand: product.brand,
      model: product.model
    })
    setIsFormOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      deleteMutation.mutate(id)
    }
  }

  const getStockColor = (quantity: number) => {
    if (quantity === 0) return 'text-red-400'
    if (quantity < 10) return 'text-yellow-400'
    return 'text-emerald-400'
  }

  const handleExport = async () => {
    try {
      await inventoryService.exportProducts()
    } catch (error) {
      alert('Error al exportar inventario')
    }
  }

  return (
    <div className="space-y-8">
      <InventoryNav />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10 backdrop-blur-md">
               <Package className="h-6 w-6 text-blue-400" />
            </div>
            <div>
               <h1 className="text-2xl font-bold text-white tracking-tight">Inventario</h1>
               <p className="text-gray-400 text-sm">Administra tus productos y niveles de stock.</p>
            </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-x-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-300 shadow-sm hover:bg-white/10 transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-x-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-300 shadow-sm hover:bg-white/10 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Importar
          </button>
          <button
            onClick={() => {
              resetForm()
              setIsFormOpen(true)
            }}
            className="inline-flex items-center gap-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-400 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o modelo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-[#0a0a0f]/60 backdrop-blur-md text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="relative w-full sm:w-64">
           <select
             value={selectedCategory || ''}
             onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
             className="w-full appearance-none px-4 py-3 border border-white/10 rounded-xl bg-[#0a0a0f]/60 backdrop-blur-md text-white focus:ring-2 focus:ring-blue-500/50 outline-none cursor-pointer"
           >
             <option value="" className="bg-[#0a0a0f]">Todas las categorías</option>
             {categories?.map((cat) => (
               <option key={cat.id} value={cat.id} className="bg-[#0a0a0f]">{cat.name}</option>
             ))}
           </select>
           <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
           </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#0a0a0f]/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Producto</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Categoría</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Precio (USD)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Stock</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-500" />
                  </td>
                </tr>
              ) : products && products.length > 0 ? (
                products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 flex items-center justify-center shadow-inner">
                          <Package className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white group-hover:text-blue-200 transition-colors">{product.name}</div>
                          {product.sku && (
                            <div className="text-xs text-gray-500 tracking-wider font-mono mt-0.5">SKU: {product.sku}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-xs">
                        {product.category?.name || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-white bg-white/5 px-2 py-1 rounded-lg border border-white/5">${Number(product.price_usd).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn("text-sm font-bold px-2 py-1 rounded-lg border bg-opacity-10", 
                        product.inventory_quantity === 0 ? "bg-red-500 border-red-500/20 text-red-400" :
                        product.inventory_quantity < 10 ? "bg-yellow-500 border-yellow-500/20 text-yellow-400" :
                        "bg-emerald-500 border-emerald-500/20 text-emerald-400"
                      )}>
                        {product.inventory_quantity || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Link
                          href={`/dashboard/inventory/kardex/${product.id}`}
                          className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                          title="Ver Historial (Kardex)"
                        >
                          <History className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedProductForAdjust(product)
                            setIsAdjustOpen(true)
                          }}
                          className="text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 p-2 rounded-lg transition-colors"
                          title="Ajustar Stock"
                        >
                          <TrendingUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 p-2 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                     <div className="flex flex-col items-center justify-center gap-2">
                        <Package className="h-12 w-12 opacity-20" />
                        <p>No hay productos en el inventario.</p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0a0a0f] border border-white/10 rounded-3xl max-w-2xl w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Glow */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
            
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <div>
                 <h2 className="text-xl font-bold text-white">
                   {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                 </h2>
                 <p className="text-xs text-gray-400 mt-1">Ingresa los detalles del producto</p>
              </div>
              <button
                onClick={() => {
                  setIsFormOpen(false)
                  resetForm()
                }}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                    placeholder="Ej: Pantalla iPhone 13 Pro Max"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                    placeholder="Generado autom."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={formData.category_id || ''}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all cursor-pointer appearance-none"
                  >
                    <option value="" className="bg-[#0a0a0f]">Seleccionar...</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-[#0a0a0f]">{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">
                    Precio Venta (USD) *
                  </label>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                     <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.price_usd}
                        onChange={(e) => setFormData({ ...formData, price_usd: Number(e.target.value) })}
                        className="w-full pl-8 pr-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                      />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">
                     Costo (USD) *
                  </label>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                     <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.cost_usd}
                        onChange={(e) => setFormData({ ...formData, cost_usd: Number(e.target.value) })}
                        className="w-full pl-8 pr-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                      />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-600"
                  />
                </div>
                {!editingProduct && (
                  <div className="col-span-2 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <label className="block text-xs font-bold text-blue-400 ml-1 mb-1.5">
                      Stock Inicial
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.initial_stock || 0}
                      onChange={(e) => setFormData({ ...formData, initial_stock: Number(e.target.value) })}
                      className="w-full px-4 py-3 border border-blue-500/20 rounded-xl bg-blue-500/5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-center font-bold text-lg"
                      placeholder="0"
                    />
                    <p className="text-[10px] text-blue-400/60 mt-2 text-center">
                      Inventario disponible al crear el producto.
                    </p>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">
                    Descripción
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-600 resize-none"
                    placeholder="Detalles adicionales..."
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-3.5 border border-white/10 text-gray-300 rounded-xl font-medium hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    editingProduct ? 'Guardar Cambios' : 'Crear Producto'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustOpen && selectedProductForAdjust && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0a0a0f] border border-white/10 rounded-3xl max-w-md w-full shadow-2xl p-8 relative overflow-hidden animate-in zoom-in-95 duration-200">
             {/* Modal Glow */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            
            <h2 className="text-xl font-bold text-white mb-2">Ajustar Stock</h2>
            <p className="text-sm text-gray-400 mb-6 font-medium">
              Producto: <span className="text-emerald-400">{selectedProductForAdjust.name}</span>
            </p>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              adjustMutation.mutate({
                id: selectedProductForAdjust.id,
                data: {
                  quantity: Number(formData.get('quantity')),
                  reason: formData.get('reason') as string
                }
              })
            }} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">
                  Cantidad del Ajuste
                </label>
                <input
                  name="quantity"
                  type="number"
                  required
                  autoFocus
                  className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-gray-600"
                  placeholder="Ej: 5 (entrada) o -2 (salida)"
                />
                <p className="text-[10px] text-gray-500 mt-2">
                   Use números positivos para entradas y negativos para salidas.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 ml-1 mb-1.5">
                  Motivo
                </label>
                <div className="relative">
                   <select
                      name="reason"
                      required
                      className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="Corrección de inventario" className="bg-[#0a0a0f]">Corrección de inventario</option>
                      <option value="Daño / Merma" className="bg-[#0a0a0f]">Daño / Merma</option>
                      <option value="Devolución" className="bg-[#0a0a0f]">Devolución</option>
                      <option value="Ajuste manual" className="bg-[#0a0a0f]">Ajuste manual</option>
                    </select>
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                     </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdjustOpen(false)}
                   className="flex-1 px-4 py-3.5 border border-white/10 text-gray-300 rounded-xl font-medium hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adjustMutation.isPending}
                  className="flex-1 px-4 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {adjustMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['inventory-products'] })}
      />
    </div>
  )
}
