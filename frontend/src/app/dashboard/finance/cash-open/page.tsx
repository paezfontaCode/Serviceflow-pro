'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFinanceStore } from '@/store/useFinanceStore'
import { financeService } from '@/lib/financeService'
import { TrendingUp, DollarSign, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Note: I assuming UI components like Card, Button, etc. exist or I'll create them if they don't.
// Let's create a simple version if they don't exist yet.

export default function CashOpenPage() {
  const [amountUSD, setAmountUSD] = useState<string>('0')
  const [amountVES, setAmountVES] = useState<string>('0')
  const [rate, setRate] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const { openSession, isLoading, error, clearError, setExchangeRate } = useFinanceStore()
  const router = useRouter()

  useEffect(() => {
    financeService.getCurrentRate()
      .then((data: any) => {
        // Use Number() to remove trailing zeros from decimal string
        const formattedRate = Number(data.rate).toString()
        setRate(formattedRate)
        setExchangeRate(Number(data.rate))
      })
      .catch(() => {})
  }, [setExchangeRate])

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // 1. Update rate if it changed
      await financeService.updateExchangeRate(parseFloat(rate))
      setExchangeRate(parseFloat(rate))
      
      // 2. Open session
      await openSession(parseFloat(amountUSD), parseFloat(amountVES), notes)
      router.push('/dashboard')
    } catch (err) {
      // Error handled by store
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Apertura de Caja</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Inicia tu turno de trabajo</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold">Error al abrir caja</p>
                  <p>{error}</p>
                  <button onClick={clearError} className="mt-2 underline text-xs">Cerrar</button>
                </div>
              </div>
            )}

            <form onSubmit={handleOpen} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="rate" className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                    Tasa de Cambio (VES/USD)
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase font-bold">Verificar hoy</span>
                  </Label>
                  <div className="relative">
                    <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      className="pl-10 h-12 text-lg font-mono font-bold border-blue-200 dark:border-blue-900 focus:ring-blue-500"
                      required
                      placeholder="Ej: 36.50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amountUSD" className="text-gray-700 dark:text-gray-300 font-medium">Monto Inicial en Caja (USD)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                    <Input
                      id="amountUSD"
                      type="number"
                      step="0.01"
                      value={amountUSD}
                      onChange={(e) => setAmountUSD(e.target.value)}
                      className="pl-8 h-12 text-lg font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amountVES" className="text-gray-700 dark:text-gray-300 font-medium">Monto Inicial en Caja (VES)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">Bs</span>
                    <Input
                      id="amountVES"
                      type="number"
                      step="0.01"
                      value={amountVES}
                      onChange={(e) => setAmountVES(e.target.value)}
                      className="pl-8 h-12 text-lg font-semibold"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-700 dark:text-gray-300 font-medium">Notas de Apertura (Opcional)</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                  placeholder="Ej: Billetes en buen estado..."
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Iniciando Sesión...
                  </>
                ) : (
                  'Abrir Caja'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
