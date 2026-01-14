'use client'

import { useState } from 'react'
import { useCartStore, CartItem } from '@/store/useCartStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { Trash2, Plus, Minus, ShoppingCart, DollarSign, Wrench, Package, Edit2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShoppingCartProps {
  onCheckout: () => void
}

function ProductCartItem({ item }: { item: CartItem }) {
  const { removeItem, updateQuantity } = useCartStore()

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 flex-1 pr-2">
          <Package className="h-4 w-4 text-blue-500 shrink-0" />
          <div>
            <h3 className="font-medium text-sm text-gray-900 dark:text-white">
              {item.name}
            </h3>
            {item.sku && (
              <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {item.sku}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => removeItem(item.id)}
          className="text-red-500 hover:text-red-600 p-1"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-l-lg"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="px-3 font-medium text-sm">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            disabled={item.quantity >= (item.max_stock || 999)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            ${(item.price_usd * item.quantity).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">
            ${item.price_usd.toFixed(2)} c/u
          </p>
        </div>
      </div>
    </div>
  )
}

function RepairCartItem({ item }: { item: CartItem }) {
  const { removeItem, updateRepairAmount } = useCartStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editAmount, setEditAmount] = useState(item.price_usd.toString())

  const handleSaveAmount = () => {
    const newAmount = parseFloat(editAmount)
    if (!isNaN(newAmount) && newAmount > 0) {
      updateRepairAmount(item.id, newAmount)
    }
    setIsEditing(false)
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 flex-1 pr-2">
          <Wrench className="h-4 w-4 text-orange-500 shrink-0" />
          <div>
            <h3 className="font-medium text-sm text-gray-900 dark:text-white">
              {item.name}
            </h3>
            {item.customer_name && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.customer_name}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => removeItem(item.id)}
          className="text-red-500 hover:text-red-600 p-1"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-600">$</span>
            <input
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-20 px-2 py-1 text-sm rounded border border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800"
              step="0.01"
              min="0"
              autoFocus
            />
            <button onClick={handleSaveAmount} className="p-1 text-green-600 hover:text-green-700">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={() => setIsEditing(false)} className="p-1 text-gray-400 hover:text-gray-500">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setEditAmount(item.price_usd.toString())
              setIsEditing(true)
            }}
            className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
          >
            <Edit2 className="h-3 w-3" />
            Pago parcial
          </button>
        )}
        <div className="text-right">
          <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
            ${item.price_usd.toFixed(2)}
          </p>
          {item.is_partial && (
            <p className="text-[10px] text-orange-500 font-medium">ABONO</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ShoppingCartComponent({ onCheckout }: ShoppingCartProps) {
  const { items, clearCart, getTotalItems, getTotalUSD, hasProducts, hasRepairs } = useCartStore()
  const exchangeRate = useFinanceStore(state => state.exchangeRate)

  const totalUSD = getTotalUSD()
  const totalVES = totalUSD * exchangeRate
  const totalItems = getTotalItems()

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Carrito</h2>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Limpiar
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}
          </p>
          {hasProducts() && hasRepairs() && (
            <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full font-medium">
              Mixto
            </span>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ShoppingCart className="h-16 w-16 mb-3 opacity-50" />
            <p className="text-sm">El carrito está vacío</p>
            <p className="text-xs mt-1">Agrega productos o servicios</p>
          </div>
        ) : (
          items.map((item) => (
            item.type === 'product' ? (
              <ProductCartItem key={item.id} item={item} />
            ) : (
              <RepairCartItem key={item.id} item={item} />
            )
          ))
        )}
      </div>

      {/* Footer with Totals */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal (USD)</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              ${totalUSD.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total (VES)</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Bs. {totalVES.toFixed(2)}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between">
              <span className="font-bold text-gray-900 dark:text-white">Total</span>
              <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                ${totalUSD.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <DollarSign className="h-5 w-5" />
          Procesar Pago
        </button>
      </div>
    </div>
  )
}

