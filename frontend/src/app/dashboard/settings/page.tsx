'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsService, SystemSettings } from '@/lib/settingsService'
import { 
  Settings, 
  Building2, 
  FileText, 
  Save, 
  Loader2, 
  CheckCircle,
  Image as ImageIcon
} from 'lucide-react'
import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [saveSuccess, setSaveSuccess] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings()
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<SystemSettings>) => settingsService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: Partial<SystemSettings> = {
      company_name: formData.get('company_name') as string,
      company_tax_id: formData.get('company_tax_id') as string,
      company_address: formData.get('company_address') as string,
      company_phone: formData.get('company_phone') as string,
      company_email: formData.get('company_email') as string,
      receipt_header: formData.get('receipt_header') as string,
      receipt_footer: formData.get('receipt_footer') as string,
      receipt_show_tax: formData.get('receipt_show_tax') === 'on'
    }
    updateMutation.mutate(data)
  }

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" />
          Configuración General
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Personaliza la información de tu empresa y tus documentos.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Company Info Section */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h2 className="font-bold text-gray-900 dark:text-white">Información de la Empresa</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Comercial</label>
                <input 
                  name="company_name" 
                  defaultValue={settings?.company_name} 
                  required 
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Fiscal / RIF</label>
                <input 
                  name="company_tax_id" 
                  defaultValue={settings?.company_tax_id} 
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono de contacto</label>
                <input 
                  name="company_phone" 
                  defaultValue={settings?.company_phone} 
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" 
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email corporativo</label>
                <input 
                  name="company_email" 
                  type="email"
                  defaultValue={settings?.company_email} 
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección Física</label>
                <textarea 
                  name="company_address" 
                  defaultValue={settings?.company_address} 
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 resize-none" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Receipt Customization Section */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <h2 className="font-bold text-gray-900 dark:text-white">Personalización de Recibos / Facturas</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-bold">Encabezado del Recibo</label>
                <p className="text-xs text-gray-500 mb-2">Este texto aparecerá en la parte superior de cada impresión.</p>
                <textarea 
                  name="receipt_header" 
                  defaultValue={settings?.receipt_header} 
                  rows={4}
                  placeholder="Ej: Resolución SENIAT #..., IVA Percibido..."
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 font-mono text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-bold">Pie de Página del Recibo</label>
                <p className="text-xs text-gray-500 mb-2">Ideal para políticas de garantía, agradecimientos o redes sociales.</p>
                <textarea 
                  name="receipt_footer" 
                  defaultValue={settings?.receipt_footer} 
                  rows={4}
                  placeholder="Ej: Gracias por su compra. Garantía de 30 días..."
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 font-mono text-sm" 
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
               <input 
                type="checkbox" 
                name="receipt_show_tax" 
                id="receipt_show_tax"
                defaultChecked={settings?.receipt_show_tax}
                className="h-4 w-4 text-blue-600 rounded"
               />
               <label htmlFor="receipt_show_tax" className="text-sm font-medium text-gray-700 dark:text-gray-200 font-bold">
                 Mostrar desglose de impuestos (IVA) en el recibo
               </label>
            </div>
          </div>
        </section>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-4 p-4 sticky bottom-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg">
          {saveSuccess && (
            <span className="text-green-600 flex items-center gap-1 font-medium animate-in fade-in slide-in-from-right-2">
              <CheckCircle className="h-4 w-4" /> Configuración guardada
            </span>
          )}
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95"
          >
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5" />}
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  )
}
