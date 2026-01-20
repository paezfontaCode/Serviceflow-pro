import { useState } from 'react';
import { 
    Users, Search, UserPlus, Mail, Phone, ChevronRight,
    Loader2, Filter, Edit2, Trash2, History, Wrench, ShoppingCart, ArrowRight,
    Download, Upload
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { customerService, CustomerCreate } from '@/services/api/customerService';
import CustomerForm from '@/components/customers/CustomerForm';
import CustomerImportModal from '@/components/customers/ImportModal';

export default function Customers() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null); // Type this properly if possible
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const { data: customers, isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: customerService.getCustomers,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: customerService.createCustomer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setIsFormOpen(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CustomerCreate> }) => 
            customerService.updateCustomer(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setIsFormOpen(false);
            setEditingCustomer(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: customerService.deleteCustomer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
        }
    });

    const handleCreate = async (data: CustomerCreate) => {
        await createMutation.mutateAsync(data);
    };

    const handleUpdate = async (data: CustomerCreate) => {
        if (editingCustomer) {
            await updateMutation.mutateAsync({ id: editingCustomer.id, data });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const openCreateModal = () => {
        setEditingCustomer(null);
        setIsFormOpen(true);
    };

    const handleExport = async () => {
        try {
            await customerService.exportCustomers();
        } catch (error) {
            console.error('Error exporting customers:', error);
        }
    };

    const openEditModal = (customer: any) => {
        setEditingCustomer(customer);
        setIsFormOpen(true);
    };

    const filteredCustomers = customers?.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.dni?.includes(searchTerm)
    );


    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white tracking-tight">Gestión de Clientes</h2>
                    <p className="text-slate-500 font-medium">Base de datos centralizada de clientes y su historial</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleExport}
                        className="px-4 py-3 flex items-center gap-2 glass hover:bg-white/5 text-slate-400 hover:text-white transition-all rounded-2xl border border-white/5 font-bold text-sm"
                        title="Exportar a CSV"
                    >
                        <Download size={18} />
                        Exportar
                    </button>
                    
                    <button 
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-4 py-3 flex items-center gap-2 glass hover:bg-white/5 text-slate-400 hover:text-white transition-all rounded-2xl border border-white/5 font-bold text-sm"
                        title="Importar desde CSV"
                    >
                        <Upload size={18} />
                        Importar
                    </button>

                    <button 
                        onClick={openCreateModal}
                        className="btn-primary px-6 py-3 flex items-center gap-2 group shadow-glow"
                    >
                        <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
                        Nuevo Cliente
                    </button>
                </div>
            </div>

            {/* Search & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 glass-card p-2 border-white/5 flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre, teléfono o DNI..." 
                            className="w-full bg-slate-900/50 border-none rounded-2xl pl-12 h-14 text-white focus:ring-2 focus:ring-primary-500/50 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="px-6 glass rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:bg-white/5 transition-all h-14 border border-white/5">
                        <Filter size={18} />
                        <span className="font-bold text-sm">Filtros</span>
                    </button>
                 </div>

                 <div className="glass-card p-6 border-white/5 flex items-center gap-4 bg-primary-600/10">
                    <div className="w-12 h-12 rounded-2xl bg-primary-500/20 flex items-center justify-center text-primary-400 shadow-glow">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Total Clientes</p>
                        <p className="text-2xl font-black text-white">{customers?.length || 0}</p>
                    </div>
                 </div>
            </div>

            {/* Customers Table/Grid */}
            <div className="glass-card border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre / DNI</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Contacto</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredCustomers?.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                                        No se encontraron clientes para la búsqueda
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers?.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <Link 
                                                    to={`/customers/${customer.id}`}
                                                    className="text-white font-bold group-hover:text-primary-400 transition-colors"
                                                >
                                                    {customer.name}
                                                </Link>

                                                <span className="text-[10px] text-slate-500 font-mono mt-0.5">{customer.dni || 'Sin Documento'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Phone size={12} className="text-slate-600" />
                                                    {customer.phone || 'No registrado'}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Mail size={12} className="text-slate-600" />
                                                    {customer.email || 'Sin correo'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {/* Logic to handle 'is_active' or default to Active if undefined on backend */}
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${customer.is_active !== false ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                {customer.is_active !== false ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => navigate(`/customers/${customer.id}`)}
                                                    className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all" 
                                                    title="Ver Historial"
                                                >
                                                    <History size={16} />
                                                </button>

                                                <button 
                                                    onClick={() => openEditModal(customer)}
                                                    className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all" 
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(customer.id)}
                                                    className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all" 
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <div className="w-px h-6 bg-white/5 mx-1" />
                                                <button className="p-2 rounded-lg bg-primary-600/10 text-primary-400 hover:bg-primary-500 hover:text-white transition-all shadow-low" title="Crear Venta/Reparación">
                                                    <ArrowRight size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 border-white/5 bg-gradient-to-br from-secondary-600/10 to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-secondary-500/20 flex items-center justify-center text-secondary-400">
                            <Wrench size={24} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">Historial de Reparaciones</h4>
                            <p className="text-xs text-slate-500">Consulta reparaciones por cliente</p>
                        </div>
                    </div>
                    <ChevronRight className="text-slate-600" />
                </div>
                
                <div className="glass-card p-6 border-white/5 bg-gradient-to-br from-primary-600/10 to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-500/20 flex items-center justify-center text-primary-400">
                            <ShoppingCart size={24} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">Cuentas por Cobrar</h4>
                            <p className="text-xs text-slate-500">Ver saldos pendientes grupales</p>
                        </div>
                    </div>
                    <ChevronRight className="text-slate-600" />
                </div>
            </div>

            <CustomerForm 
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={editingCustomer ? handleUpdate : handleCreate}
                initialData={editingCustomer}
                isEditing={!!editingCustomer}
            />

            <CustomerImportModal 
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['customers'] })}
            />
        </div>
    );
}
