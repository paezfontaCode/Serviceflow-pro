'use client'

import { useQuery } from '@tanstack/react-query'
import posService, { Sale } from '@/lib/posService'
import { settingsService } from '@/lib/settingsService'
import { X, CheckCircle, Printer, ShoppingBag } from 'lucide-react'

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  saleId: number | null
}

export default function ReceiptModal({ isOpen, onClose, saleId }: ReceiptModalProps) {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings()
  })

  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale', saleId],
    queryFn: () => posService.getSale(saleId!),
    enabled: !!saleId && isOpen
  })

  if (!isOpen || !saleId) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:relative">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl print:shadow-none print:max-w-none print:w-[80mm] print:rounded-none">
        {/* Header - Hidden on print */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">¡Venta Exitosa!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Venta #{sale?.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Receipt content actually printed */}
        <div className="p-6 space-y-4 print:p-2 print:text-[10pt] print:text-black">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 print:hidden">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : sale ? (
            <>
              {/* Company Logo and Name */}
              <div className="text-center space-y-1 mb-4">
                {settings?.company_logo_url && (
                    <img src={settings.company_logo_url} alt="Logo" className="h-12 mx-auto mb-2 object-contain" />
                )}
                <h2 className="text-xl font-black uppercase tracking-tighter print:text-lg">
                  {settings?.company_name || 'Serviceflow Pro'}
                </h2>
                {settings?.company_tax_id && (
                    <p className="text-xs text-gray-500 print:text-black">RIF: {settings.company_tax_id}</p>
                )}
              </div>

              {/* Custom Header */}
              {settings?.receipt_header && (
                <div className="text-center text-[10px] whitespace-pre-line border-b border-dashed border-gray-200 pb-2 print:border-black print:text-black">
                  {settings.receipt_header}
                </div>
              )}

              {/* Sale Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-1 print:bg-transparent print:p-0 print:border-b print:border-dashed print:border-black print:rounded-none">
                <div className="flex justify-between text-sm print:text-xs">
                  <span className="text-gray-600 dark:text-gray-400 print:text-black">Venta ID</span>
                  <span className="font-bold">#{sale.id.toString().padStart(5, '0')}</span>
                </div>
                <div className="flex justify-between text-sm print:text-xs">
                  <span className="text-gray-600 dark:text-gray-400 print:text-black">Fecha</span>
                  <span className="font-medium">
                    {new Date(sale.created_at).toLocaleString('es-VE')}
                  </span>
                </div>
                <div className="flex justify-between text-sm print:text-xs">
                  <span className="text-gray-600 dark:text-gray-400 print:text-black">Pago</span>
                  <span className="font-medium capitalize">{sale.payment_method} ({sale.payment_status})</span>
                </div>
              </div>

              {/* Items */}
              <div className="border-b border-dashed border-gray-200 pb-2 print:border-black">
                <div className="flex justify-between font-bold text-xs uppercase mb-1">
                    <span>Descripción</span>
                    <span>Total</span>
                </div>
                <div className="space-y-1">
                  {sale.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm print:text-xs">
                      <span className="text-gray-600 dark:text-gray-400 print:text-black line-clamp-1">
                        {item.quantity} x {item.product_name || `Prod #${item.product_id}`}
                      </span>
                      <span className="font-medium">
                        ${Number(item.subtotal_usd).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1 pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold print:text-sm">TOTAL USD</span>
                  <span className="text-xl font-black text-blue-600 dark:text-blue-400 print:text-black print:text-lg tracking-tighter">
                    ${Number(sale.total_usd).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm print:text-xs font-bold">
                  <span className="text-gray-600 dark:text-gray-400 print:text-black uppercase">Monto en BS</span>
                  <span>Bs. {Number(sale.total_ves).toFixed(2)}</span>
                </div>
                <div className="text-[10px] text-gray-400 flex justify-between print:text-black italic">
                  <span>Tasa del día:</span>
                  <span>{Number(sale.exchange_rate).toFixed(2)} VES/USD</span>
                </div>
              </div>

              {/* Custom Footer */}
              {settings?.receipt_footer && (
                <div className="text-center text-[10px] whitespace-pre-line border-t border-dashed border-gray-200 pt-2 mt-4 print:border-black print:text-black italic">
                   {settings.receipt_footer}
                </div>
              )}

              {sale.notes && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 print:hidden">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Notas:</span> {sale.notes}
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Actions - Hidden on print */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="h-5 w-5" />
            Imprimir Recibo
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Finalizar
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\:relative, .print\:relative * {
            visibility: visible;
          }
          .print\:relative {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
