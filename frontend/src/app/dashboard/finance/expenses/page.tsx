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
  Filter
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ExpensesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
            <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gastos Operativos</h1>
            <p className="text-gray-600 dark:text-gray-400">Control de egresos y costos del negocio</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-x-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50"
          >
            Categorías
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-x-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
          >
            <Plus className="h-5 w-5" />
            Registrar Gasto
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-3 font-medium">Descripción / Fecha</th>
                <th className="px-6 py-3 font-medium">Categoría</th>
                <th className="px-6 py-3 font-medium">Método</th>
                <th className="px-6 py-3 font-medium text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoadingExpenses ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-600" />
                  </td>
                </tr>
              ) : !expenses || expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No se han registrado gastos aún
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">{expense.description}</div>
                      <div className="text-xs text-gray-500">{format(new Date(expense.date), 'dd MMM yyyy', { locale: es })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                        {categories?.find(c => c.id === expense.category_id)?.name || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {expense.payment_method}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-black text-red-600">
                        -${Number(expense.amount_usd).toFixed(2)}
                      </div>
                      {expense.currency !== 'USD' && (
                        <div className="text-[10px] text-gray-400">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nuevo Gasto</h2>
              <button onClick={() => setIsFormOpen(false)}><X className="h-6 w-6 text-gray-400" /></button>
            </div>
            
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Descripción *</label>
                <input name="description" required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" placeholder="Ej: Pago de Alquiler Enero" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Monto *</label>
                  <input name="amount" type="number" step="0.01" required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 font-bold" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Moneda</label>
                  <select name="currency" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
                    <option value="USD">USD ($)</option>
                    <option value="VES">VES (Bs)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Categoría *</label>
                  <select name="category_id" required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
                    <option value="">Seleccionar...</option>
                    {categories?.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Método de Pago *</label>
                  <select name="payment_method" required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Pago Móvil">Pago Móvil</option>
                    <option value="Zelle">Zelle</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fecha</label>
                <input name="date" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
              </div>

              {!currentSession && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs rounded-lg">
                  Atención: No hay una sesión de caja abierta. El gasto se registrará pero no afectará el balance de caja actual.
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" disabled={createExpenseMutation.isPending} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 flex justify-center items-center gap-2">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestionar Categorías</h2>
              <button onClick={() => setIsCategoryModalOpen(false)}><X className="h-6 w-6 text-gray-400" /></button>
            </div>
            
            <form onSubmit={handleCategorySubmit} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Nueva Categoría</label>
                <div className="flex gap-2">
                  <input name="name" required className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" placeholder="Ej: Servicios" />
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">Añadir</button>
                </div>
              </div>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories?.map(cat => (
                <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="font-medium">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
