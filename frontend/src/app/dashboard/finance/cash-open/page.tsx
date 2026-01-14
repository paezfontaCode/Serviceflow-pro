'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFinanceStore } from '@/store/useFinanceStore'
import { financeService } from '@/lib/financeService'
import { TrendingUp, DollarSign, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
        const formattedRate = Number(data.rate).toString()
        setRate(formattedRate)
        setExchangeRate(Number(data.rate))
      })
      .catch(() => {})
  }, [setExchangeRate])

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await financeService.updateExchangeRate(parseFloat(rate))
      setExchangeRate(parseFloat(rate))
      await openSession(parseFloat(amountUSD), parseFloat(amountVES), notes)
      router.push('/dashboard')
    } catch (err) {
      // Error handled by store
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md">
        <div className="bg-[#0a0a0f]/60 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-white/10 relative">
          {/* Decorative Gradient */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
          
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-lg shadow-blue-500/10">
                <DollarSign className="h-7 w-7 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Apertura de Caja</h1>
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Inicia tu turno de trabajo</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold">Error al abrir caja</p>
                  <p>{error}</p>
                  <button onClick={clearError} className="mt-2 text-xs font-bold underline hover:text-red-300">Cerrar</button>
                </div>
              </div>
            )}

            <form onSubmit={handleOpen} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="rate" className="text-gray-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    Tasa de Cambio (VES/USD)
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full uppercase font-black border border-blue-500/20">Verificar hoy</span>
                  </Label>
                  <div className="relative group">
                    <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400 group-focus-within:text-blue-300 transition-colors" />
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      className="pl-12 h-14 text-xl font-mono font-bold bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-blue-500/50 rounded-2xl transition-all"
                      required
                      placeholder="Ej: 36.50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amountUSD" className="text-gray-300 font-bold text-xs uppercase tracking-wider">Monto Inicial en Caja (USD)</Label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-lg group-focus-within:text-white transition-colors">$</span>
                    <Input
                      id="amountUSD"
                      type="number"
                      step="0.01"
                      value={amountUSD}
                      onChange={(e) => setAmountUSD(e.target.value)}
                      className="pl-10 h-14 text-lg font-bold bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-emerald-500/50 rounded-2xl transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amountVES" className="text-gray-300 font-bold text-xs uppercase tracking-wider">Monto Inicial en Caja (VES)</Label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs group-focus-within:text-white transition-colors">Bs</span>
                    <Input
                      id="amountVES"
                      type="number"
                      step="0.01"
                      value={amountVES}
                      onChange={(e) => setAmountVES(e.target.value)}
                      className="pl-10 h-14 text-lg font-bold bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-emerald-500/50 rounded-2xl transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-300 font-bold text-xs uppercase tracking-wider">Notas de Apertura (Opcional)</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none min-h-[80px] placeholder-gray-600 transition-all font-medium"
                  placeholder="Ej: Billetes en buen estado..."
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 text-lg font-black bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] uppercase tracking-wide"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Iniciando...
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
