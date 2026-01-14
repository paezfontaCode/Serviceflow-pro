'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import customerService, { CustomerFormData } from '@/lib/customerService'
import { Users, Plus, Search, Edit, Trash2, Loader2, X, Phone, Mail } from 'lucide-react'

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any>(null)
  const [formData, setFormData] = useState<CustomerFormData>({ name: '', phone: '', dni: '' })
  
  const queryClient = useQueryClient()

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', searchQuery],
    queryFn: () => customerService.getCustomers(searchQuery || undefined)
  })

  const createMutation = useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setIsFormOpen(false)
      resetForm()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CustomerFormData> }) =>
      customerService.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setIsFormOpen(false)
      resetForm()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: customerService.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  const resetForm = () => {
    setFormData({ name: '', phone: '', dni: '' })
    setEditingCustomer(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      notes: customer.notes,
      dni: customer.dni
    })
    setIsFormOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/10">
            <Users className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Clientes</h1>
            <p className="text-gray-400 text-sm">Gestiona tu base de clientes</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm()
            setIsFormOpen(true)
          }}
          className="inline-flex items-center justify-center gap-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 hover:from-blue-500 hover:to-purple-500 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-[#0a0a0f]/60 backdrop-blur-md text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent outline-none transition-all shadow-sm group-hover:bg-[#0a0a0f]/80"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
          </div>
        ) : customers && customers.length > 0 ? (
          customers.map((customer: any) => (
            <div key={customer.id} className="group relative bg-[#0a0a0f]/40 backdrop-blur-sm border border-white/5 rounded-2xl p-5 hover:border-purple-500/30 hover:bg-[#0a0a0f]/60 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-bold text-lg text-white truncate group-hover:text-purple-400 transition-colors">{customer.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                      ID: #{customer.id}
                    </span>
                    {customer.dni && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/10 text-[10px] font-medium text-blue-400 uppercase tracking-wider">
                        {customer.dni}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(customer)}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                {customer.phone && (
                  <div className="flex items-center gap-3 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span className="truncate">{customer.phone}</span>
                  </div>
                )}
                
                {customer.email && (
                  <div className="flex items-center gap-3 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                     <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 gap-4 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Users className="h-8 w-8 opacity-20" />
            </div>
            <p>No hay clientes registrados aún</p>
            <button
               onClick={() => { resetForm(); setIsFormOpen(true); }}
               className="text-purple-400 hover:text-purple-300 font-medium text-sm"
            >
              Crear el primer cliente
            </button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0a0a0f]/95 border border-white/10 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
            {/* Modal Glow */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-purple-500/20 blur-2xl rounded-full" />
            
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <div>
                 <h2 className="text-xl font-bold text-white">
                   {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
                 </h2>
                 <p className="text-xs text-gray-400 mt-1">Ingresa los datos del cliente a continuación</p>
              </div>
              <button 
                onClick={() => { setIsFormOpen(false); resetForm() }} 
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-400 ml-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all placeholder:text-gray-600"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-400 ml-1">Cédula / RIF</label>
                    <input
                      type="text"
                      value={formData.dni || ''}
                      onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                      className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all placeholder:text-gray-600"
                      placeholder="Ej: V-12345678"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-400 ml-1">Teléfono</label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all placeholder:text-gray-600"
                      placeholder="Ej: 0412-1234567"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-400 ml-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all placeholder:text-gray-600"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-400 ml-1">Dirección</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all placeholder:text-gray-600"
                    placeholder="Dirección completa"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-400 ml-1">Notas</label>
                  <textarea
                    rows={3}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-white/10 rounded-xl bg-white/5 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all placeholder:text-gray-600 resize-none"
                    placeholder="Información adicional..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); resetForm() }}
                  className="flex-1 px-4 py-3.5 border border-white/10 text-gray-300 rounded-xl font-medium hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-500/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    editingCustomer ? 'Guardar Cambios' : 'Crear Cliente'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
