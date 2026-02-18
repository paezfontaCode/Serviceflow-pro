import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  Trash2,
  Loader2,
  TrendingDown,
  Calendar,
  Download
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService, ExpenseRead } from '@/services/api/expenseService';
import { formatUSD, formatVES } from '@/utils/currency';
import { useExchangeRateStore } from '@/store/exchangeRateStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ExpenseSchema } from '@/lib/schemas';

export default function Expenses() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queryClient = useQueryClient();
  const rate = useExchangeRateStore(state => state.rate);

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: expenseService.getExpenses,
  });

  const deleteMutation = useMutation({
    mutationFn: expenseService.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Gasto eliminado');
    }
  });

  const totalUSD = expenses?.reduce((acc: number, exp: ExpenseRead) => acc + (exp.currency === 'USD' ? exp.amount : exp.amount / rate), 0) || 0;

  const filteredExpenses = expenses?.filter((exp: ExpenseRead) =>
    exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    if (!filteredExpenses || filteredExpenses.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    const headers = ['Fecha', 'Categoría', 'Descripción', 'Monto', 'Moneda'];
    const rows = filteredExpenses.map(exp => [
      format(new Date(exp.date), 'dd/MM/yyyy'),
      `"${exp.category.replace(/"/g, '""')}"`,
      `"${exp.description.replace(/"/g, '""')}"`,
      exp.amount,
      exp.currency
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gastos_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.className = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV generado correctamente');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight">{t('expenses.title')}</h2>
          <p className="text-slate-500 text-sm font-medium">{t('expenses.subtitle')}</p>
        </div>

        <div className="flex gap-4 w-full lg:w-auto">
          <div className="glass-card px-6 py-2 border-rose-500/20 bg-rose-500/5 flex flex-col items-end justify-center">
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Total Egresos</span>
            <span className="text-xl font-black text-white">{formatUSD(totalUSD)}</span>
          </div>
          <button
            onClick={handleExportCSV}
            className="glass h-12 px-6 rounded-2xl flex items-center gap-2 text-slate-400 hover:text-white transition-all border border-white/5 font-bold text-sm"
            title="Exportar a CSV"
          >
            <Download size={18} />
            <span className="hidden md:inline">Exportar CSV</span>
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn-primary h-12 px-8 flex items-center gap-2 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="glass-card border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Buscar gasto o categoría..."
              className="input-field pl-12 h-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-white/5 bg-white/[0.02]">
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Descripción</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoría</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Monto</th>
                <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando egresos...</p>
                  </td>
                </tr>
              ) : filteredExpenses?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-600">
                    <TrendingDown size={60} strokeWidth={1} className="mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No se encontraron registros de gastos</p>
                  </td>
                </tr>
              ) : (filteredExpenses || []).map((expense: ExpenseRead) => (
                <tr key={expense.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-primary-400 transition-colors">
                        <Calendar size={18} />
                      </div>
                      <span className="text-xs font-bold text-white uppercase">
                        {format(new Date(expense.date), "dd/MM/yyyy")}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 text-sm font-medium text-slate-300">{expense.description}</td>
                  <td className="p-6">
                    <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      {expense.category}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-black text-white">
                        {expense.currency === 'USD' ? formatUSD(expense.amount) : formatVES(expense.amount)}
                      </span>
                      {expense.currency === 'VES' && (
                        <span className="text-[10px] text-slate-500 font-bold">≈ {formatUSD(expense.amount / rate)}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          if (confirm('¿Seguro que deseas eliminar este gasto?')) deleteMutation.mutate(expense.id);
                        }}
                        className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all scale-90 group-hover:scale-100 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Form Modal */}
      {isFormOpen && (
        <ExpenseFormModal onClose={() => setIsFormOpen(false)} />
      )}
    </div>
  );
}

function ExpenseFormModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: 'USD' as 'USD' | 'VES',
    category: 'Operativo',
    date: new Date().toISOString().split('T')[0]
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: expenseService.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Gasto registrado');
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const validationData = {
      category_id: formData.category === 'Operativo' ? 1 : 2, // Mocking ID
      amount: parseFloat(formData.amount),
      description: formData.description,
      payment_method: 'other' // Placeholder
    };

    const result = ExpenseSchema.safeParse(validationData);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const path = issue.path[0] as string;
        errors[path] = issue.message;
      });
      setFieldErrors(errors);
      toast.error('Corrige los errores');
      return;
    }

    mutation.mutate({ ...formData, amount: result.data.amount });
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative glass-card w-full max-w-md p-8 border-white/10 animate-fade-in-up">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <TrendingDown size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Registrar Egreso</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Descripción</label>
            <input
              className="input-field h-12"
              placeholder="Ej: Pago de alquiler"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            {fieldErrors.description && <p className="text-[10px] text-rose-500 font-bold px-1">{fieldErrors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Monto</label>
              <input
                type="number"
                step="0.01"
                className="input-field h-12"
                placeholder="0.00"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              {fieldErrors.amount && <p className="text-[10px] text-rose-500 font-bold px-1">{fieldErrors.amount}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Moneda</label>
              <select
                className="input-field h-12"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
              >
                <option value="USD">USD ($)</option>
                <option value="VES">VES (Bs.)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Categoría</label>
            <select
              className="input-field h-12"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Operativo">Operativo</option>
              <option value="Personal">Personal / Nómina</option>
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Servicios">Servicios Públicos</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <button type="submit" disabled={mutation.isPending} className="btn-primary w-full h-14 mt-4 font-black uppercase tracking-widest text-xs">
            {mutation.isPending ? <Loader2 className="animate-spin" /> : 'Confirmar Registro'}
          </button>
        </form>
      </div>
    </div>
  );
}
