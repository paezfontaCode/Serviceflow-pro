'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { purchaseService, Supplier, SupplierCreate } from '@/lib/purchaseService'
import { InventoryNav } from '@/components/inventory/InventoryNav'
import { Plus, Search, Loader2, Edit, Trash2, Building2, Phone, Mail, MapPin, X } from 'lucide-react'

export default function SuppliersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  
  const queryClient = useQueryClient()

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => purchaseService.getSuppliers()
  })
  
  const createMutation = useMutation({
    mutationFn: purchaseService.createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setIsFormOpen(false)
      setEditingSupplier(null)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SupplierCreate> }) => 
      purchaseService.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setIsFormOpen(false)
      setEditingSupplier(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: purchaseService.deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      contact_name: formData.get('contact_name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      tax_id: formData.get('tax_id') as string,
      notes: formData.get('notes') as string
    }
    
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="space-y-6">
      <InventoryNav />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proveedores</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestiona los proveedores de repuestos y productos.</p>
        </div>
        <button
          onClick={() => {
            setEditingSupplier(null)
            setIsFormOpen(true)
          }}
          className="inline-flex items-center gap-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          <Plus className="h-5 w-5" />
          Nuevo Proveedor
        </button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
           <div className="col-span-full flex justify-center py-12">
             <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
           </div>
        ) : suppliers && suppliers.length > 0 ? (
          suppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{supplier.name}</h3>
                      <p className="text-xs text-gray-500">{supplier.tax_id || 'Sin ID Fiscal'}</p>
                    </div>
                  </div>
                    <button
                      onClick={() => {
                        setEditingSupplier(supplier)
                        setIsFormOpen(true)
                      }}
                      className="text-gray-400 hover:text-blue-600 p-1"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('¿Estás seguro de eliminar este proveedor?')) {
                          deleteMutation.mutate(supplier.id)
                        }
                      }}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {supplier.contact_name && (
                    <div className="flex items-center gap-2">
                       <span className="font-medium text-gray-900 dark:text-white">{supplier.contact_name}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2">
                       <Phone className="h-4 w-4 text-gray-400" />
                       <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2">
                       <Mail className="h-4 w-4 text-gray-400" />
                       <span className="truncate">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-start gap-2">
                       <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                       <span className="line-clamp-2">{supplier.address}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {supplier.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 italic">
                  "{supplier.notes}"
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay proveedores</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Registra proveedores para gestionar tus compras.</p>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full shadow-2xl p-6">
             <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
             </h2>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de Empresa *</label>
                   <input name="name" defaultValue={editingSupplier?.name} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Fiscal / RIF</label>
                      <input name="tax_id" defaultValue={editingSupplier?.tax_id} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Persona de Contacto</label>
                      <input name="contact_name" defaultValue={editingSupplier?.contact_name} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                      <input name="email" type="email" defaultValue={editingSupplier?.email} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                      <input name="phone" defaultValue={editingSupplier?.phone} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
                   <textarea name="address" defaultValue={editingSupplier?.address} rows={2} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 resize-none" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
                   <textarea name="notes" defaultValue={editingSupplier?.notes} rows={2} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 resize-none" />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancelar</button>
                  <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex justify-center items-center gap-2">
                     {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                     Guardar
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  )
}
