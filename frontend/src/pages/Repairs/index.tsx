import { useState } from 'react';
import {
  Search,
  Plus,
  History,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  Kanban
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repairService, WorkOrderRead } from '@/services/api/repairService';
import { toast } from 'sonner';
import WorkOrderForm from './components/WorkOrderForm';
import { KanbanBoard } from '@/components/modules/repairs/KanbanBoard';

export default function Repairs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrderRead | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const queryClient = useQueryClient();

  const { data: pagination, isLoading } = useQuery({
    queryKey: ['workOrders', showArchived, searchTerm],
    queryFn: () => repairService.getWorkOrders(1, 100, !showArchived, searchTerm),
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

  const filteredOrders = workOrders;

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between shrink-0">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-black text-white tracking-tight">Órdenes de Reparación</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Gestión técnica y seguimiento</p>
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
              onClick={() => setViewMode('list')} // Placeholder for list view if needed later
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Vista Lista"
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowArchived(!showArchived)}
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
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3">
            {/* Simple loading state */}
            <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="h-full overflow-hidden">
            {/* We pass filteredOrders but mapped to WorkOrder type (casting if needed since types match mostly) */}
            <KanbanBoard
              orders={filteredOrders as any}
              onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
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
