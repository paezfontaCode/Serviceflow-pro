'use client'

import { useState } from 'react'
import CashGuard from '@/components/finance/CashGuard'
import ProductCatalog from '@/components/pos/ProductCatalog'
import RepairSelector from '@/components/pos/RepairSelector'
import ShoppingCart from '@/components/pos/ShoppingCart'
import CheckoutModal from '@/components/pos/CheckoutModal'
import ReceiptModal from '@/components/pos/ReceiptModal'
import { ShoppingBag, Download, Package, Wrench } from 'lucide-react'
import posService from '@/lib/posService'
import { cn } from '@/lib/utils'

type TabType = 'products' | 'repairs'

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('products')
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

  const tabs = [
    { id: 'products' as TabType, label: 'Productos', icon: Package },
    { id: 'repairs' as TabType, label: 'Reparaciones', icon: Wrench }
  ]

  return (
    <CashGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Punto de Venta</h1>
              <p className="text-gray-600 dark:text-gray-400">Vende productos y cobra servicios</p>
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
          {/* Left: Catalog (2/3 width on large screens) */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-800">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-all relative",
                      activeTab === tab.id
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    )}
                  >
                    <tab.icon className="h-5 w-5" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'products' ? (
                  <ProductCatalog />
                ) : (
                  <RepairSelector />
                )}
              </div>
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
