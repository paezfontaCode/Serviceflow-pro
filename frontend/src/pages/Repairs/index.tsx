import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  History,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  Kanban,
  Clock,
  User,
  Smartphone
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repairService, WorkOrderRead } from '@/services/api/repairService';
import { toast } from 'sonner';
import { formatUSD } from '@/utils/currency';
import { format } from 'date-fns';
import WorkOrderForm from './components/WorkOrderForm';
import { KanbanBoard } from '@/components/modules/repairs/KanbanBoard';
import Pagination from '@/components/Pagination';

export default function Repairs() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrderRead | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: pagination, isLoading } = useQuery({
    queryKey: ['workOrders', showArchived, searchTerm, page],
    queryFn: () => repairService.getWorkOrders(page, viewMode === 'kanban' ? 50 : 10, !showArchived, searchTerm),
  });

  const workOrders = pagination?.items || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => repairService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      toast.success('Estado actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar estado');
    }
  });

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between shrink-0">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-black text-white tracking-tight">{t('repairs.title')}</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t('repairs.subtitle')}</p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* View Toggle */}
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-slate-400 hover:text-white'}`}
              title="Vista Kanban"
            >
              <Kanban size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-slate-400 hover:text-white'}`}
              title="Vista Lista"
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowArchived(!showArchived);
                setPage(1);
              }}
              className={`px-3 h-11 flex items-center gap-2 transition-all rounded-xl border font-bold text-xs ${showArchived ? 'bg-primary-500/20 text-primary-400 border-primary-500/30 shadow-lg shadow-primary-500/10' : 'glass hover:bg-white/5 text-slate-400 hover:text-white border-white/5'}`}
              title={showArchived ? "Ocultar equipos entregados y pagados" : "Mostrar equipos entregados y pagados"}
            >
              <History size={18} />
              <span className="hidden md:inline">{showArchived ? "Ocultar Archivados" : "Ver Archivados"}</span>
            </button>
            <button
              onClick={() => repairService.exportRepairs()}
              className="px-3 h-11 flex items-center gap-2 glass hover:bg-white/5 text-slate-400 hover:text-white transition-all rounded-xl border border-white/5 font-bold text-xs"
              title="Exportar CSV"
            >
              <FileSpreadsheet size={18} />
            </button>
            <button
              onClick={() => repairService.exportRepairsPDF()}
              className="px-3 h-11 flex items-center gap-2 glass hover:bg-white/5 text-slate-400 hover:text-white transition-all rounded-xl border border-white/5 font-bold text-xs"
              title="Exportar PDF"
            >
              <FileText size={18} />
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedOrder(undefined);
              setIsOrderFormOpen(true);
            }}
            className="btn-primary px-6 h-11 flex items-center gap-2 group flex-1 lg:flex-none shadow-lg shadow-primary-500/20"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            <span className="text-sm font-bold">Nueva Orden</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 shrink-0">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Buscar por cliente, descripción, IMEI o #ID..."
            className="input-field pl-11 h-11 text-sm"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Cargando reparaciones...</span>
          </div>
        ) : viewMode === 'kanban' ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden">
              <KanbanBoard
                orders={workOrders as any}
                onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
              />
            </div>
            <Pagination
              currentPage={page}
              totalPages={pagination?.pages || 0}
              totalItems={pagination?.total || 0}
              itemsOnPage={workOrders.length}
              onPageChange={setPage}
            />
          </div>
        ) : (
          <div className="flex-1 glass-card border-white/5 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 sticky top-0 z-10">
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Orden / Fecha</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cliente / Equipo</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Entrega / Garantía</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Costo / Saldo</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {workOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-30">
                          <History size={48} className="text-slate-500" />
                          <span className="font-bold text-slate-500 uppercase tracking-widest text-xs">No se encontraron reparaciones</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    workOrders.map((order) => (
                      <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white mb-0.5">#{order.id.toString().padStart(5, '0')}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock size={10} />
                            {format(new Date(order.created_at), 'dd/MM/yy HH:mm')}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 mb-0.5">
                            <User size={12} className="text-primary-500" />
                            <span className="font-bold text-slate-300 text-sm">{order.customer_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <Smartphone size={12} />
                            <span>{order.device_model}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-xs text-slate-400 line-clamp-2 max-w-xs">{order.problem_description}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${order.status === 'RECEIVED' ? 'bg-blue-500/10 text-blue-400' :
                            order.status === 'DIAGNOSED' ? 'bg-amber-500/10 text-amber-400' :
                              order.status === 'REPAIRING' ? 'bg-primary-500/10 text-primary-400 shadow-glow-sm' :
                                order.status === 'READY' ? 'bg-emerald-500/10 text-emerald-400' :
                                  order.status === 'DELIVERED' ? 'bg-slate-500/20 text-slate-400' :
                                    'bg-white/5 text-slate-500'
                            }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {order.status === 'DELIVERED' && order.delivered_at ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                                <Clock size={12} />
                                {format(new Date(order.delivered_at), 'dd/MM/yy')}
                              </div>
                              {order.is_warranty_active && order.warranty_expiration && (
                                <div className="text-[9px] text-slate-500 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 w-fit">
                                  Garantía: {format(new Date(order.warranty_expiration), 'dd/MM/yy')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">PENDIENTE</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-bold text-white">{formatUSD(Number(order.labor_cost_usd) + Number(order.parts_cost_usd))}</div>
                          <div className={`text-[10px] font-black ${Number(order.paid_amount_usd) >= (Number(order.labor_cost_usd) + Number(order.parts_cost_usd))
                            ? 'text-emerald-500' : 'text-rose-400'
                            }`}>
                            Saldo: {formatUSD((Number(order.labor_cost_usd) + Number(order.parts_cost_usd)) - Number(order.paid_amount_usd))}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsOrderFormOpen(true);
                            }}
                            className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-primary-400 transition-colors"
                          >
                            <LayoutGrid size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page}
              totalPages={pagination?.pages || 0}
              totalItems={pagination?.total || 0}
              itemsOnPage={workOrders.length}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <WorkOrderForm
        isOpen={isOrderFormOpen}
        onClose={() => setIsOrderFormOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
}
