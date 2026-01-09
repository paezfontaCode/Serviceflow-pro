'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportService, KardexEntry } from '@/lib/reportService'
import inventoryService from '@/lib/inventoryService'
import { cn } from '@/lib/utils'
import { 
  History, 
  ArrowUpLeft, 
  ArrowDownRight, 
  Loader2,
  Calendar,
  User,
  Info
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function KardexPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const productId = parseInt(id)

  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => inventoryService.getProduct(productId)
  })

  const { data: kardex, isLoading } = useQuery({
    queryKey: ['kardex', productId],
    queryFn: () => reportService.getProductKardex(productId)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
            <History className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kardex de Producto</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Historial de movimientos: <span className="font-bold text-blue-600">{product?.name || 'Cargando...'}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 font-bold">Fecha / Hora</th>
                <th className="px-6 py-4 font-bold">Tipo</th>
                <th className="px-6 py-4 font-bold">Referencia</th>
                <th className="px-6 py-4 font-bold text-center">Variación</th>
                <th className="px-6 py-4 font-bold">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                  </td>
                </tr>
              ) : !kardex || kardex.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No hay movimientos registrados para este producto.
                  </td>
                </tr>
              ) : (
                kardex.map((entry: KardexEntry, index: number) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                           <div className="font-medium text-gray-900 dark:text-white">
                             {format(new Date(entry.date), 'dd MMMM, yyyy', { locale: es })}
                           </div>
                           <div className="text-[10px] text-gray-500">
                             {format(new Date(entry.date), 'HH:mm:ss')}
                           </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={cn(
                         "px-2 py-1 rounded text-[10px] font-black uppercase",
                         entry.type === 'VENTA' ? "bg-red-100 text-red-700" :
                         entry.type === 'COMPRA' ? "bg-green-100 text-green-700" :
                         "bg-blue-100 text-blue-700"
                       )}>
                         {entry.type}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                       <div className="flex items-center gap-1">
                         <Info className="h-3 w-3" />
                         {entry.reference}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className={cn(
                         "text-base font-black flex items-center justify-center gap-1",
                         entry.change > 0 ? "text-green-600" : "text-red-600"
                       )}>
                         {entry.change > 0 ? <ArrowUpLeft className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                         {entry.change > 0 ? `+${entry.change}` : entry.change}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-gray-500">
                         <User className="h-3 w-3" />
                         {entry.user}
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
