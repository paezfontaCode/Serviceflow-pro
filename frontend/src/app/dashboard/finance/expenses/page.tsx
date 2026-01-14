'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseService, ExpenseCreate } from '@/lib/expenseService'
import { useFinanceStore } from '@/store/useFinanceStore'
import { 
  Plus, 
  Search, 
  Loader2, 
  X, 
  DollarSign, 
  Calendar, 
  Tag, 
  CreditCard,
  TrendingDown,
  Trash2,
  Filter,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ExpensesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const { currentSession } = useFinanceStore()
  
  const queryClient = useQueryClient()

  const { data: expenses, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expenseService.getExpenses()
  })

  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => expenseService.getCategories()
  })

  const createExpenseMutation = useMutation({
    mutationFn: expenseService.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['finance-session'] })
      setIsFormOpen(false)
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Error al registrar gasto")
    }
  })

  const createCategoryMutation = useMutation({
    mutationFn: expenseService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
      setIsCategoryModalOpen(false)
    }
  })

  const handleExpenseSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: ExpenseCreate = {
      description: formData.get('description') as string,
      amount: Number(formData.get('amount')),
      currency: formData.get('currency') as string || 'USD',
      payment_method: formData.get('payment_method') as string,
      category_id: Number(formData.get('category_id')),
      date: formData.get('date') as string || format(new Date(), 'yyyy-MM-dd'),
      session_id: currentSession?.id
    }
    createExpenseMutation.mutate(data)
  }

  const handleCategorySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createCategoryMutation.mutate({
      name: formData.get('name') as string,
      description: formData.get('description') as string
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/10 backdrop-blur-md">
            <TrendingDown className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Gastos Operativos</h1>
            <p className="text-gray-400 text-sm font-medium">Control de egresos y costos del negocio</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-x-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-gray-300 shadow-sm hover:bg-white/10 transition-colors"
          >
            <Tag className="h-4 w-4" />
            Categorías
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-x-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 hover:from-red-500 hover:to-orange-500 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Registrar Gasto
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-[#0a0a0f]/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-gray-400 uppercase tracking-widest text-xs">
              <tr>
                <th className="px-6 py-4 font-black">Descripción / Fecha</th>
                <th className="px-6 py-4 font-black">Categoría</th>
                <th className="px-6 py-4 font-black">Método</th>
                <th className="px-6 py-4 font-black text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {isLoadingExpenses ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-500" />
                  </td>
                </tr>
              ) : !expenses || expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-gray-500">
                     <div className="flex flex-col items-center justify-center gap-3">
                        <DollarSign className="h-10 w-10 opacity-20" />
                        <p className="font-medium">No se han registrado gastos aún</p>
                     </div>
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-base group-hover:text-red-200 transition-colors">{expense.description}</div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                         <Calendar className="h-3 w-3" />
                         {format(new Date(expense.date), 'dd MMM yyyy', { locale: es })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-xs font-bold text-gray-300">
                        {categories?.find(c => c.id === expense.category_id)?.name || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-medium">
                       <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 opacity-50" />
                          {expense.payment_method}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-black text-red-500 text-base">
                        -${Number(expense.amount_usd).toFixed(2)}
                      </div>
                      {expense.currency !== 'USD' && (
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                          {Number(expense.amount).toLocaleString()} {expense.currency}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0a0a0f] border border-white/10 rounded-3xl max-w-lg w-full shadow-2xl p-8 relative overflow-hidden animate-in zoom-in-95 duration-200">
             {/* Modal Glow */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />
            
            <div className="flex justify-between items-center mb-8">
              <div>
                 <h2 className="text-xl font-black text-white">Nuevo Gasto</h2>
                 <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Registrar salida de dinero</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                 <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleExpenseSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1.5">Descripción *</label>
                <input 
                   name="description" 
                   required 
                   className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all placeholder:text-gray-600" 
                   placeholder="Ej: Pago de Alquiler Enero" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1.5">Monto *</label>
                  <input 
                     name="amount" 
                     type="number" 
                     step="0.01" 
                     required 
                     className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1.5">Moneda</label>
                  <div className="relative">
                     <select 
                        name="currency" 
                        className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all appearance-none cursor-pointer"
                     >
                        <option value="USD" className="bg-[#0a0a0f]">USD ($)</option>
                        <option value="VES" className="bg-[#0a0a0f]">VES (Bs)</option>
                     </select>
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                     </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1.5">Categoría *</label>
                  <div className="relative">
                     <select 
                        name="category_id" 
                        required 
                        className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all appearance-none cursor-pointer"
                     >
                        <option value="" className="bg-[#0a0a0f]">Seleccionar...</option>
                        {categories?.map(cat => (
                           <option key={cat.id} value={cat.id} className="bg-[#0a0a0f]">{cat.name}</option>
                        ))}
                     </select>
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                     </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1.5">Método de Pago *</label>
                  <div className="relative">
                     <select 
                        name="payment_method" 
                        required 
                        className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all appearance-none cursor-pointer"
                     >
                        <option value="Efectivo" className="bg-[#0a0a0f]">Efectivo</option>
                        <option value="Transferencia" className="bg-[#0a0a0f]">Transferencia</option>
                        <option value="Pago Móvil" className="bg-[#0a0a0f]">Pago Móvil</option>
                        <option value="Zelle" className="bg-[#0a0a0f]">Zelle</option>
                     </select>
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                     </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1.5">Fecha</label>
                <input 
                   name="date" 
                   type="date" 
                   defaultValue={format(new Date(), 'yyyy-MM-dd')} 
                   className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all appearance-none" 
                />
              </div>

              {!currentSession && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-xs rounded-xl font-medium flex items-start gap-2">
                   <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                   Atención: No hay una sesión de caja abierta. El gasto se registrará pero no afectará el balance de caja actual.
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                   type="button" 
                   onClick={() => setIsFormOpen(false)} 
                   className="flex-1 px-4 py-3.5 border border-white/10 text-gray-300 rounded-xl font-medium hover:bg-white/5 transition-colors"
                >
                   Cancelar
                </button>
                <button 
                   type="submit" 
                   disabled={createExpenseMutation.isPending} 
                   className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-red-500/20 flex justify-center items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {createExpenseMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0a0a0f] border border-white/10 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
             {/* Modal Glow */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
            
            <div className="flex justify-between items-center mb-6">
              <div>
                 <h2 className="text-xl font-black text-white">Gestionar Categorías</h2>
                 <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Categorías de gastos</p>
              </div>
              <button 
                 onClick={() => setIsCategoryModalOpen(false)}
                 className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                 <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCategorySubmit} className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-1.5">Nueva Categoría</label>
                <div className="flex gap-2">
                  <input 
                     name="name" 
                     required 
                     className="flex-1 px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-600" 
                     placeholder="Ej: Servicios" 
                  />
                  <button 
                     type="submit" 
                     className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold transition-all"
                  >
                     Añadir
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
              {categories?.map(cat => (
                <div key={cat.id} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <span className="font-bold text-gray-300 text-sm">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
