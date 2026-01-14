'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import posService, { Product } from '@/lib/posService'
import { useCartStore } from '@/store/useCartStore'
import { Search, Package, Plus, AlertCircle } from 'lucide-react'

export default function ProductCatalog() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()
  const addProduct = useCartStore(state => state.addProduct)

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', searchQuery, selectedCategory],
    queryFn: () => posService.getProducts({
      search: searchQuery || undefined,
      category_id: selectedCategory,
      in_stock: true,
      limit: 50
    })
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => posService.getCategories()
  })

  const handleAddToCart = (product: Product) => {
    addProduct({
      product_id: product.id,
      name: product.name,
      price_usd: Number(product.price_usd),
      max_stock: Number(product.inventory_quantity || 0),
      sku: product.sku
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las categorías</option>
          {categories?.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
        {products && products.length > 0 ? (
          products.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                  {product.sku && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.sku}</p>
                  )}
                  {product.brand && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">{product.brand} {product.model}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Package className="h-3 w-3 text-gray-400" />
                  <span className={`font-medium ${
                    (product.inventory_quantity || 0) > 10 
                      ? 'text-green-600' 
                      : (product.inventory_quantity || 0) > 0 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                  }`}>
                    {product.inventory_quantity || 0}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${Number(product.price_usd).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.in_stock}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 flex flex-col items-center justify-center py-12 text-gray-500">
            <AlertCircle className="h-12 w-12 mb-3" />
            <p>No se encontraron productos</p>
          </div>
        )}
      </div>
    </div>
  )
}
