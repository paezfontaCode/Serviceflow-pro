import { useState } from 'react';
import { X, UserPlus, Loader2, CheckCircle2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService, CustomerCreate, DniType } from '@/services/api/customerService';
import { toast } from 'sonner';

interface CustomerQuickModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCustomerCreated?: (customerId: number) => void;
}

const DNI_TYPES: { value: DniType; label: string }[] = [
    { value: 'V', label: 'V' },
    { value: 'J', label: 'J' },
    { value: 'E', label: 'E' },
    { value: 'P', label: 'P' },
];

export default function CustomerQuickModal({ isOpen, onClose, onCustomerCreated }: CustomerQuickModalProps) {
    const queryClient = useQueryClient();
    
    const [dniType, setDniType] = useState<DniType>('V');
    const [dni, setDni] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const createMutation = useMutation({
        mutationFn: (data: CustomerCreate) => customerService.createCustomer(data),
        onSuccess: (customer) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('Cliente registrado', {
                description: `${customer.name} agregado exitosamente`,
                icon: <CheckCircle2 className="text-emerald-500" />
            });
            onCustomerCreated?.(customer.id);
            resetAndClose();
        },
        onError: (error: any) => {
            const detail = error.response?.data?.detail;
            const message = typeof detail === 'string' ? detail : 
                          (Array.isArray(detail) ? detail.map((e: any) => e.msg).join(', ') : 'Intente nuevamente');
            
            toast.error('Error al registrar cliente', {
                description: message
            });
        }

    });

    const resetAndClose = () => {
        setDniType('V');
        setDni('');
        setName('');
        setPhone('');
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        createMutation.mutate({
            name: name.trim(),
            dni: dni.trim() || undefined,
            dni_type: dniType,
            phone: phone.trim() || undefined,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={resetAndClose}></div>
            
            <div className="relative glass-card w-full max-w-md overflow-hidden border-white/10 animate-fade-in-up">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <UserPlus size={24} />
                        </div>
                        <h2 className="text-lg font-bold text-white">Registro Rápido</h2>
                    </div>
                    <button 
                        onClick={resetAndClose} 
                        className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* DNI Row */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Documento de Identidad
                        </label>
                        <div className="flex gap-2">
                            {/* DNI Type Selector */}
                            <div className="flex bg-slate-900/50 rounded-xl border border-white/5 overflow-hidden">
                                {DNI_TYPES.map(type => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setDniType(type.value)}
                                        className={`
                                            px-4 py-3 text-sm font-bold transition-all
                                            ${dniType === type.value 
                                                ? 'bg-primary-600 text-white' 
                                                : 'text-slate-500 hover:text-white hover:bg-white/5'}
                                        `}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                            {/* DNI Number */}
                            <input
                                type="text"
                                placeholder="12345678"
                                value={dni}
                                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                                className="flex-1 bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-primary-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Nombre Completo <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Juan Pérez"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:border-primary-500 outline-none transition-all"
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Teléfono
                        </label>
                        <input
                            type="tel"
                            placeholder="0414-1234567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:border-primary-500 outline-none transition-all"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={resetAndClose}
                            className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending || !name.trim()}
                            className="flex-[2] btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {createMutation.isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <UserPlus size={18} />
                                    <span>Registrar Cliente</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
