import { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { CustomerCreate } from '@/services/api/customerService';

interface CustomerFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CustomerCreate) => Promise<void>;
    initialData?: CustomerCreate | null;
    isEditing?: boolean;
}

const INITIAL_STATE: CustomerCreate = {
    name: '',
    dni_type: 'V',
    dni: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: ''
};

export default function CustomerForm({ isOpen, onClose, onSubmit, initialData, isEditing = false }: CustomerFormProps) {
    const [formData, setFormData] = useState<CustomerCreate>(INITIAL_STATE);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name || '',
                    dni_type: initialData.dni_type || 'V',
                    dni: initialData.dni || '',
                    email: initialData.email || '',
                    phone: initialData.phone || '',
                    address: initialData.address || '',
                    city: initialData.city || '',
                    notes: initialData.notes || ''
                });
            } else {
                setFormData(INITIAL_STATE);
            }
            setError(null);
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await onSubmit(formData);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error al guardar el cliente');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary-500/20 rounded-lg text-primary-400">
                            <User size={20} />
                        </div>
                        {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Completo *</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder:text-slate-600"
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>
                        </div>

                        {/* ID Document */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Documento (Cédula/RIF)</label>
                            <div className="flex gap-2">
                                <select
                                    name="dni_type"
                                    value={formData.dni_type}
                                    onChange={handleChange}
                                    className="bg-slate-900 border border-white/10 rounded-xl py-3 px-3 text-white focus:outline-none focus:border-primary-500"
                                >
                                    <option value="V">V</option>
                                    <option value="J">J</option>
                                    <option value="E">E</option>
                                    <option value="P">P</option>
                                </select>
                                <div className="relative flex-1">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="text"
                                        name="dni"
                                        value={formData.dni}
                                        onChange={handleChange}
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary-500 transition-all placeholder:text-slate-600"
                                        placeholder="12345678"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary-500 transition-all placeholder:text-slate-600"
                                    placeholder="0414-1234567"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary-500 transition-all placeholder:text-slate-600"
                                    placeholder="cliente@ejemplo.com"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-3 text-slate-500" size={18} />
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary-500 transition-all placeholder:text-slate-600 resize-none"
                                    placeholder="Dirección completa..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors font-bold"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={18} />
                                    {isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
