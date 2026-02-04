import { useState } from 'react';
import {
  Search,
  Plus,
  Wrench,
  User,
  Smartphone,
  Calendar,
  ArrowUpRight,
  Loader2,
  Download,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repairService, WorkOrderRead } from '@/services/api/repairService';
import { formatUSD } from '@/utils/currency';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import WorkOrderForm from './components/WorkOrderForm';
import WhatsAppButton from '@/components/WhatsAppButton';

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: 'bg-blue-500 text-white border-blue-600',
  IN_PROGRESS: 'bg-amber-500 text-slate-900 border-amber-600 font-black',
  COMPLETED: 'bg-emerald-500 text-white border-emerald-600',
  DELIVERED: 'bg-slate-600 text-white border-slate-700',
  CANCELLED: 'bg-rose-500 text-white border-rose-600',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-500/10 text-slate-400 border-white/5',
  MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/10',
  HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/10',
  URGENT: 'bg-rose-500/10 text-rose-400 border-rose-500/10 animate-pulse',
};

const TYPE_COLORS: Record<string, string> = {
  software: 'bg-purple-500/10 text-purple-400 border-purple-500/10',
  hardware: 'bg-orange-500/10 text-orange-400 border-orange-500/10',
  service: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/10',
};

export default function Repairs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrderRead | undefined>(undefined);
  const queryClient = useQueryClient();

  const { data: workOrders, isLoading } = useQuery({
    queryKey: ['workOrders'],
    queryFn: repairService.getWorkOrders,
  });

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

  const filteredOrders = workOrders?.filter((order: WorkOrderRead) => {
    const matchesSearch =
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.problem_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.device_imei?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter ? order.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-black text-white tracking-tight">Órdenes de Reparación</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Gestión técnica y seguimiento</p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => repairService.exportRepairs()}
              className="px-3 h-11 flex items-center gap-2 glass hover:bg-white/5 text-slate-400 hover:text-white transition-all rounded-xl border border-white/5 font-bold text-xs"
              title="Exportar CSV"
            >
              <FileSpreadsheet size={18} />
              <span className="hidden md:inline">CSV</span>
            </button>
            <button
              onClick={() => repairService.exportRepairsPDF()}
              className="px-3 h-11 flex items-center gap-2 glass hover:bg-white/5 text-slate-400 hover:text-white transition-all rounded-xl border border-white/5 font-bold text-xs"
              title="Exportar PDF"
            >
              <FileText size={18} />
              <span className="hidden md:inline">PDF</span>
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

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Buscar por cliente, descripción o IMEI..."
            className="input-field pl-11 h-11 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'DELIVERED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? null : status)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all whitespace-nowrap uppercase tracking-tighter ${statusFilter === status ? 'bg-primary-500 text-white border-primary-400 shadow-lg shadow-primary-500/20' : 'glass border-white/5 text-slate-500 hover:text-white hover:border-white/10'}`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="h-[300px] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Cargando órdenes...</p>
        </div>
      ) : filteredOrders?.length === 0 ? (
        <div className="h-[300px] glass-card flex flex-col items-center justify-center text-slate-600 space-y-3 border-white/5 opacity-50">
          <Wrench size={60} strokeWidth={1} />
          <p className="text-lg font-bold">No hay órdenes que coincidan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders?.map((order) => (
            <RepairCard
              key={order.id}
              order={order}
              onStatusChange={(status) => updateStatusMutation.mutate({ id: order.id, status })}
              onEdit={() => {
                setSelectedOrder(order);
                setIsOrderFormOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <WorkOrderForm
        isOpen={isOrderFormOpen}
        onClose={() => setIsOrderFormOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
}

function RepairCard({ order, onStatusChange, onEdit }: { order: WorkOrderRead, onStatusChange: (status: string) => void, onEdit: () => void }) {
  const balance = (Number(order.labor_cost_usd) + Number(order.parts_cost_usd)) - Number(order.paid_amount_usd);

  return (
    <div className="glass-card group hover:border-primary-500/40 transition-all duration-300 flex flex-col overflow-hidden border-white/5">
      {/* Interaction Layer */}
      <div className="p-4.5 space-y-4">
        {/* Header: Compact Row */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-slate-500 tracking-widest">#{order.id.toString().padStart(5, '0')}</span>
              <span className={`px-1.5 py-0.5 rounded border text-[8px] font-black uppercase ${PRIORITY_COLORS[order.priority]}`}>
                {order.priority}
              </span>
              <span className={`px-1.5 py-0.5 rounded border text-[8px] font-black uppercase ${TYPE_COLORS[order.repair_type] || TYPE_COLORS.service}`}>
                {order.repair_type}
              </span>
            </div>
            <h3
              onClick={onEdit}
              className="text-base font-black text-white hover:text-primary-400 cursor-pointer transition-colors uppercase tracking-tight line-clamp-1"
            >
              {order.device_model}
            </h3>
          </div>

          <div className="relative flex-shrink-0">
            <select
              className={`pl-2.5 pr-8 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-tighter cursor-pointer outline-none transition-all shadow-sm shadow-black/20 appearance-none ${STATUS_COLORS[order.status] || 'bg-slate-700 text-white border-slate-600'}`}
              value={order.status}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              {Object.keys(STATUS_COLORS).map(status => (
                <option key={status} value={status} className="bg-[#0f172a] text-white">{status.replace('_', ' ')}</option>
              ))}
              {/* Force delievered if triggered from backend */}
              {order.status === 'DELIVERED' && <option value="DELIVERED">DELIVERED</option>}
              {order.status === 'ON_HOLD' && <option value="ON_HOLD">ON HOLD</option>}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60">
              <Search size={10} className="hidden" /> {/* Placeholder for logic, will use native arrow or tailwind peer */}
              {/* Custom arrow for the select */}
              <svg className="w-3 h-3 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Info Grid: Multi-column for space saving */}
        <div className="grid grid-cols-1 gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 flex-shrink-0">
              <User size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-black text-slate-500 uppercase leading-none mb-0.5">Cliente</p>
              <p className="text-[11px] font-bold text-white uppercase truncate">{order.customer_name || 'Sin nombre'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 flex-shrink-0">
              <Smartphone size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-black text-slate-500 uppercase leading-none mb-0.5">Falla</p>
              <p className="text-[11px] text-slate-300 line-clamp-1 italic">"{order.problem_description}"</p>
            </div>
          </div>
        </div>

        {/* Footer: Balance, Date and Actions */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Calendar size={8} />
              {format(new Date(order.created_at), "d MMM", { locale: es })}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-base font-black ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatUSD(balance)}
              </span>
              {balance > 0 && <span className="text-[8px] font-black text-rose-500/50 uppercase">Deuda</span>}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <WhatsAppButton
              customerName={order.customer_name || 'Cliente'}
              phone={order.customer_phone}
              orderId={order.id}
              status={order.status}
              device={order.device_model}
              balance={balance}
              className="h-9 px-3 text-[10px]"
            />

            <button
              onClick={() => repairService.getReceipt(order.id)}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-primary-400 hover:text-primary-300 transition-all flex items-center justify-center border border-white/5"
              title="Descargar Recibo"
            >
              <Download size={16} />
            </button>

            <button
              onClick={onEdit}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center group/btn border border-white/5"
            >
              <ArrowUpRight size={16} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
