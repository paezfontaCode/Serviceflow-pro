'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import repairService, { RepairFormData, Repair } from '@/lib/repairService'
import customerService from '@/lib/customerService'
import { 
  Wrench, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  X, 
  User, 
  Package, 
  Cpu, 
  Smartphone, 
  ClipboardCheck,
  DollarSign,
  AlertCircle,
  ChevronRight
} from 'lucide-react'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import RepairPartsModal from '@/components/repairs/RepairPartsModal'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const STATUS_CONFIG = {
  received: { label: 'Recibido', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', icon: Clock },
  in_progress: { label: 'En Progreso', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400', icon: Wrench },
  ready: { label: 'Listo', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle },
  delivered: { label: 'Entregado', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', icon: XCircle }
}

const TYPE_CONFIG = {
  software: { label: 'Software', icon: Cpu, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400', description: 'Sistemas, Liberaciones' },
  hardware: { label: 'Hardware', icon: Smartphone, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400', description: 'Pantallas, Pines, Placas' },
  service: { label: 'Servicio', icon: ClipboardCheck, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400', description: 'Revisiones, Mantenimiento' }
}

export default function RepairsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedRepairId, setSelectedRepairId] = useState<number | null>(null)
  // View is always table (compact) mode
  const [searchQuery, setSearchQuery] = useState('')
  
  const [formData, setFormData] = useState<RepairFormData>({
    customer_id: undefined,
    device_model: '',
    problem_description: '',
    repair_type: 'service',
    estimated_cost_usd: 0,
    labor_cost_usd: 0
  })
  
  const queryClient = useQueryClient()

  const { data: repairs, isLoading } = useQuery({
    queryKey: ['repairs', statusFilter],
    queryFn: () => repairService.getRepairs(statusFilter || undefined)
  })

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers()
  })

  const createMutation = useMutation({
    mutationFn: (data: RepairFormData) => repairService.createRepair(data),
    onSuccess: (newRepair) => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] })
      setIsFormOpen(false)
      setFormData({ 
        customer_id: undefined, 
        device_model: '', 
        problem_description: '',
        repair_type: 'service',
        estimated_cost_usd: 0,
        labor_cost_usd: 0
      })
      if (newRepair.repair_type === 'hardware') {
        setSelectedRepairId(newRepair.id)
      }
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      repairService.updateRepair(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.customer_id) {
      alert('Por favor selecciona un cliente')
      return
    }
    createMutation.mutate(formData)
  }

  const handleStatusChange = (repairId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: repairId, status: newStatus })
  }

  // Filtrado por búsqueda y estado
  const filteredRepairs = (repairs || []).filter((repair: Repair) => {
    const matchesStatus = !statusFilter || repair.status === statusFilter
    const matchesSearch = !searchQuery || 
      repair.device_model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repair.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      repair.problem_description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const totalActive = filteredRepairs.filter((r: Repair) => r.status !== 'delivered' && r.status !== 'cancelled').length

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 rounded-[35px] p-8 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Wrench className="h-32 w-32 rotate-12" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 bg-white/20 backdrop-blur-xl rounded-[24px] flex items-center justify-center border border-white/30 shadow-inner">
              <Wrench className="h-9 w-9 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Servicio Técnico</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  {totalActive} Activas
                </span>
                <span className="text-blue-100 text-sm font-medium">Gestiona órdenes en tiempo real</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="group inline-flex items-center gap-x-2 rounded-[22px] bg-white px-8 py-4 text-sm font-black text-blue-600 shadow-xl shadow-black/10 hover:bg-orange-50 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
            Nuevo Ingreso
          </button>
        </div>
      </div>

      {/* Categories & Search */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-2 flex gap-1 overflow-x-auto no-scrollbar shadow-sm">
            {[{ value: '', label: 'Todos' }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))].map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={cn(
                  "px-6 py-2.5 rounded-2xl text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap",
                  statusFilter === s.value
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-96">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              placeholder="Buscar equipo o cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
            />
          </div>

        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">ID</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Cliente</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Equipo</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Problema</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Presupuesto</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Estado</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
                </td>
              </tr>
            ) : filteredRepairs.length > 0 ? (
              filteredRepairs.map((repair: Repair) => {
                const statusInfo = STATUS_CONFIG[repair.status as keyof typeof STATUS_CONFIG];
                return (
                  <tr key={repair.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <td className="px-4 py-3 font-black text-gray-900 dark:text-white">#{repair.id}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                      {repair.customer_name || 'Particular'}
                      {repair.customer_dni && (
                        <span className="block text-[10px] text-gray-400">{repair.customer_dni}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{repair.device_model}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-[150px] truncate" title={repair.problem_description}>
                      "{repair.problem_description}"
                    </td>
                    <td className="px-4 py-3 font-black text-blue-600">${Number(repair.estimated_cost_usd).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase", statusInfo?.color)}>
                        {statusInfo?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <select
                        value={repair.status}
                        onChange={(e) => handleStatusChange(repair.id, e.target.value)}
                        className="text-xs font-black rounded px-2 py-1 bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500/30"
                      >
                        {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                          <option key={value} value={value}>{config.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setSelectedRepairId(repair.id)}
                        className="p-1.5 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded"
                        title="Repuestos"
                      >
                        <Package className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  No hay reparaciones que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Entry Drawer */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            />
            <div className="absolute inset-y-0 right-0 max-w-full flex">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-screen max-w-xl bg-white dark:bg-gray-950 shadow-2xl flex flex-col"
              >
                <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-blue-600 rounded-[22px] flex items-center justify-center shadow-2xl shadow-blue-600/30">
                      <Plus className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white">Nuevo Ingreso</h2>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Servicio Técnico Pro</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsFormOpen(false)} 
                    className="h-12 w-12 rounded-full hover:bg-white dark:hover:bg-gray-800 flex items-center justify-center text-gray-400 transition-all hover:text-red-500 hover:rotate-90 hover:shadow-lg"
                  >
                    <X className="h-7 w-7" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                  {/* Step 1: Customer */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-black text-sm">1</div>
                      <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Identificación del Cliente</h3>
                    </div>
                    <SearchableSelect
                      options={customers?.map(c => ({
                        value: c.id,
                        label: c.name,
                        subLabel: c.dni ? `CI/RIF: ${c.dni}` : undefined
                      })) || []}
                      value={formData.customer_id}
                      onChange={(val) => setFormData({ ...formData, customer_id: Number(val) })}
                      placeholder="Buscar por nombre o documento..."
                    />
                  </div>

                  {/* Step 2: Device */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-black text-sm">2</div>
                        <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Información del Equipo</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Modelo</label>
                          <input
                            required
                            value={formData.device_model}
                            onChange={(e) => setFormData({ ...formData, device_model: e.target.value })}
                            className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner"
                            placeholder="Ej: iPhone 14 Pro"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">IMEI / Serial</label>
                          <input
                            value={formData.device_imei || ''}
                            onChange={(e) => setFormData({ ...formData, device_imei: e.target.value })}
                            className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner"
                            placeholder="Opcional"
                          />
                        </div>
                      </div>
                  </div>

                  {/* Step 3: Category */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-black text-sm">3</div>
                        <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Categoría de Servicio</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormData({ ...formData, repair_type: key as any })}
                          className={cn(
                            "flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all relative overflow-hidden group",
                            formData.repair_type === key 
                              ? "border-blue-600 bg-blue-50 dark:bg-blue-900/10 scale-[1.02] shadow-lg shadow-blue-500/10" 
                              : "border-gray-50 dark:border-gray-900 bg-white dark:bg-gray-900 hover:border-blue-200"
                          )}
                        >
                          <config.icon className={cn("h-7 w-7 transition-colors", formData.repair_type === key ? "text-blue-600" : "text-gray-400")} />
                          <span className={cn("text-[10px] font-black uppercase tracking-widest", formData.repair_type === key ? "text-blue-600" : "text-gray-500")}>
                            {config.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 4: Diagnostic */}
                  <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-black text-sm">4</div>
                        <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Problema & Presupuesto</h3>
                      </div>
                      <textarea
                        required
                        rows={4}
                        value={formData.problem_description}
                        onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
                        className="w-full px-5 py-4 rounded-3xl bg-gray-50 dark:bg-gray-900 border-none text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner resize-none"
                        placeholder="Describe el síntoma o falla..."
                      />
                      
                      <div className="bg-blue-600 rounded-[35px] p-8 text-white shadow-xl shadow-blue-600/30 flex items-center justify-between">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Mano de Obra Estimada</label>
                          <div className="flex items-center text-4xl font-black">
                            <span className="text-blue-200 mr-2">$</span>
                            <input 
                              type="number"
                              value={formData.labor_cost_usd}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0
                                setFormData({ ...formData, labor_cost_usd: val, estimated_cost_usd: val })
                              }}
                              className="bg-transparent border-none outline-none focus:ring-0 p-0 m-0 w-32 placeholder-blue-400"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center">
                          <DollarSign className="h-8 w-8" />
                        </div>
                      </div>
                  </div>
                </form>

                <div className="p-8 bg-gray-50 dark:bg-gray-900 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 px-8 py-5 rounded-[22px] font-black text-gray-500 hover:bg-white dark:hover:bg-gray-800 transition-all uppercase text-xs tracking-widest"
                  >
                    Salir
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending}
                    className="flex-[2] px-8 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[22px] font-black shadow-2xl shadow-blue-600/40 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 transition-all uppercase text-xs tracking-[0.2em]"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <ClipboardCheck className="h-5 w-5" />
                        Registrar Ingreso
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <RepairPartsModal 
        repairId={selectedRepairId || 0}
        isOpen={selectedRepairId !== null}
        onClose={() => setSelectedRepairId(null)}
      />
    </div>
  )
}