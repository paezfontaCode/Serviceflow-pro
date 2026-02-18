import { useState } from 'react';
import {
    Users,
    Mail,
    Phone,
    MapPin,
    FileText,
    Save,
    X,
    Loader2
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseService } from '@/services/api/purchaseService';
import { SupplierRead, SupplierCreate } from '@/types/api';
import { SupplierSchema } from '@/lib/schemas';
import { toast } from 'sonner';

interface SupplierFormProps {
    supplier?: SupplierRead | null;
    onClose: () => void;
}

export default function SupplierForm({ supplier, onClose }: SupplierFormProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<SupplierCreate>({
        name: supplier?.name || '',
        contact_name: supplier?.contact_name || '',
        email: supplier?.email || '',
        phone: supplier?.phone || '',
        address: supplier?.address || '',
        tax_id: supplier?.tax_id || '',
        notes: supplier?.notes || '',
        is_active: supplier?.is_active ?? true
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const mutation = useMutation({
        mutationFn: (data: SupplierCreate) =>
            supplier ? purchaseService.updateSupplier(supplier.id, data) : purchaseService.createSupplier(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success(supplier ? 'Proveedor actualizado' : 'Proveedor registrado');
            onClose();
        },
        onError: () => {
            toast.error('Ocurrió un error al guardar');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});

        const result = SupplierSchema.safeParse(formData);

        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                const path = issue.path[0] as string;
                errors[path] = issue.message;
            });
            setFieldErrors(errors);
            toast.error('Corrige los errores en el formulario');
            return;
        }

        mutation.mutate(formData);
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative glass-card w-full max-w-2xl p-8 border-white/10 animate-fade-in-up">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
                            <Users size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-white">
                            {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nombre / Empresa</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    className="input-field pl-10 h-12"
                                    placeholder="Ej: Inversiones Tech C.A."
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            {fieldErrors.name && <p className="text-[10px] text-rose-500 font-bold px-1">{fieldErrors.name}</p>}
                        </div>

                        {/* RIF / Tax ID */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">RIF / Tax ID</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    className="input-field pl-10 h-12"
                                    placeholder="J-12345678-9"
                                    value={formData.tax_id}
                                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Contact Person */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Persona de Contacto</label>
                            <input
                                className="input-field h-12"
                                placeholder="Nombre del vendedor..."
                                value={formData.contact_name}
                                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Teléfono</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    className="input-field pl-10 h-12"
                                    placeholder="+58 412..."
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    className="input-field pl-10 h-12"
                                    placeholder="proveedor@empresa.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            {fieldErrors.email && <p className="text-[10px] text-rose-500 font-bold px-1">{fieldErrors.email}</p>}
                        </div>

                        {/* Address */}
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Dirección</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    className="input-field pl-10 h-12"
                                    placeholder="Dirección fiscal..."
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Notas Internas</label>
                            <textarea
                                className="input-field p-4 min-h-[100px] resize-none"
                                placeholder="Detalles adicionales..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-xl border border-white/10 text-slate-400 font-bold hover:bg-white/5"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex-[2] btn-primary h-12 flex items-center justify-center gap-2"
                        >
                            {mutation.isPending ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            <span className="font-black uppercase tracking-widest text-xs">
                                {supplier ? 'Guardar Cambios' : 'Registrar Proveedor'}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
