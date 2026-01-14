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
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Settings className="h-8 w-8 text-blue-500 animate-spin-slow" />
          Configuración General
        </h1>
        <p className="text-gray-400 mt-2 text-lg">Personaliza la información de tu empresa y tus documentos.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Company Info Section */}
        <section className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="px-8 py-5 border-b border-white/10 bg-white/5 flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
              <Building2 className="h-5 w-5 text-blue-400" />
            </div>
            <h2 className="font-bold text-xl text-white">Información de la Empresa</h2>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nombre Comercial</label>
                <input 
                  name="company_name" 
                  defaultValue={settings?.company_name} 
                  required 
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500/50 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">ID Fiscal / RIF</label>
                <input 
                  name="company_tax_id" 
                  defaultValue={settings?.company_tax_id} 
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500/50 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Teléfono de contacto</label>
                <input 
                  name="company_phone" 
                  defaultValue={settings?.company_phone} 
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500/50 outline-none" 
                />
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email corporativo</label>
                <input 
                  name="company_email" 
                  type="email"
                  defaultValue={settings?.company_email} 
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500/50 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Dirección Física</label>
                <textarea 
                  name="company_address" 
                  defaultValue={settings?.company_address} 
                  rows={3}
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500/50 outline-none resize-none" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Receipt Customization Section */}
        <section className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="px-8 py-5 border-b border-white/10 bg-white/5 flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-500/30">
              <FileText className="h-5 w-5 text-purple-400" />
            </div>
            <h2 className="font-bold text-xl text-white">Personalización de Recibos / Facturas</h2>
          </div>
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1.5">Encabezado del Recibo</label>
                <p className="text-xs text-gray-500 mb-3">Este texto aparecerá en la parte superior de cada impresión.</p>
                <textarea 
                  name="receipt_header" 
                  defaultValue={settings?.receipt_header} 
                  rows={4}
                  placeholder="Ej: Resolución SENIAT #..., IVA Percibido..."
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-purple-500/50 outline-none resize-none font-mono text-sm leading-relaxed" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1.5">Pie de Página del Recibo</label>
                <p className="text-xs text-gray-500 mb-3">Ideal para políticas de garantía, agradecimientos o redes sociales.</p>
                <textarea 
                  name="receipt_footer" 
                  defaultValue={settings?.receipt_footer} 
                  rows={4}
                  placeholder="Ej: Gracias por su compra. Garantía de 30 días..."
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:ring-2 focus:ring-purple-500/50 outline-none resize-none font-mono text-sm leading-relaxed" 
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 transition-colors hover:bg-white/10">
               <input 
                type="checkbox" 
                name="receipt_show_tax" 
                id="receipt_show_tax"
                defaultChecked={settings?.receipt_show_tax}
                className="h-5 w-5 text-blue-600 rounded-lg bg-black/20 border-white/20 focus:ring-offset-0 focus:ring-2 focus:ring-blue-500/50"
               />
               <label htmlFor="receipt_show_tax" className="text-sm font-bold text-gray-200 cursor-pointer select-none">
                 Mostrar desglose de impuestos (IVA) en el recibo
               </label>
            </div>
          </div>
        </section>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-4 p-4 sticky bottom-6 bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-40 transform transition-all hover:scale-[1.01]">
          {saveSuccess && (
            <span className="text-emerald-400 flex items-center gap-2 font-bold animate-in fade-in slide-in-from-right-4 px-3 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <CheckCircle className="h-4 w-4" /> Configuración guardada
            </span>
          )}
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all active:scale-95"
          >
            {updateMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  )
}
