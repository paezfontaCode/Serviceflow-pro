'use client'

import { useState } from 'react'
import CashGuard from '@/components/finance/CashGuard'
import ProductCatalog from '@/components/pos/ProductCatalog'
import ShoppingCart from '@/components/pos/ShoppingCart'
import CheckoutModal from '@/components/pos/CheckoutModal'
import ReceiptModal from '@/components/pos/ReceiptModal'
import { ShoppingBag, Download } from 'lucide-react'
import posService from '@/lib/posService'

export default function SalesPage() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [completedSaleId, setCompletedSaleId] = useState<number | null>(null)

  const handleCheckout = () => {
    setIsCheckoutOpen(true)
  }

  const handleCheckoutSuccess = (saleId: number) => {
    setIsCheckoutOpen(false)
    setCompletedSaleId(saleId)
    setIsReceiptOpen(true)
  }

  const handleReceiptClose = () => {
    setIsReceiptOpen(false)
    setCompletedSaleId(null)
  }

  const handleExport = async () => {
    try {
      await posService.exportSales()
    } catch (error) {
      alert('Error al exportar historial de ventas')
    }
  }

  return (
    <CashGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Punto de Venta</h1>
              <p className="text-gray-600 dark:text-gray-400">Gestiona tus ventas en tiempo real</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-x-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50"
          >
            <Download className="h-5 w-5" />
            Exportar Historial
          </button>
        </div>

        {/* POS Layout - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Product Catalog (2/3 width on large screens) */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Catálogo de Productos
              </h2>
              <ProductCatalog />
            </div>
          </div>

          {/* Right: Shopping Cart (1/3 width on large screens) */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <ShoppingCart onCheckout={handleCheckout} />
            </div>
          </div>
        </div>

        {/* Modals */}
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={handleCheckoutSuccess}
        />
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={handleReceiptClose}
          saleId={completedSaleId}
        />
      </div>
    </CashGuard>
  )
}
