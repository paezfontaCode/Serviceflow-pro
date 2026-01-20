import { useState, useEffect } from 'react';
import { X, UserPlus, Loader2, CheckCircle2, Shield } from 'lucide-react';
import { userService, Role } from '@/services/api/userService';
import { toast } from 'sonner';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserCreated: () => void;
}

export default function UserModal({ isOpen, onClose, onUserCreated }: UserModalProps) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState<number | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isPending, setIsPending] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchRoles();
        }
    }, [isOpen]);

    const fetchRoles = async () => {
        try {
            const data = await userService.getRoles();
            setRoles(data);
            if (data.length > 0) {
                setSelectedRole(data[0].id);
            }
        } catch (error) {
            toast.error('Error al cargar roles');
        }
    };

    const resetAndClose = () => {
        setUsername('');
        setEmail('');
        setFullName('');
        setPassword('');
        setIsPending(false);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!username || !email || !password) {
            toast.error('Por favor completa los campos obligatorios');
            return;
        }

        try {
            setIsPending(true);
            const newUser = await userService.createUser({
                username: username.trim(),
                email: email.trim(),
                full_name: fullName.trim(),
                password: password,
                is_active: true
            });

            if (selectedRole) {
                await userService.assignRole(newUser.id, selectedRole);
            }

            toast.success('Usuario registrado', {
                description: `${newUser.full_name || newUser.username} agregado exitosamente`,
                icon: <CheckCircle2 className="text-emerald-500" />
            });
            onUserCreated();
            resetAndClose();
        } catch (error: any) {
            const detail = error.response?.data?.detail;
            const message = typeof detail === 'string' ? detail : 'Error al registrar usuario';
            toast.error(message);
        } finally {
            setIsPending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={resetAndClose}></div>
            
            <div className="relative glass-card w-full max-w-md overflow-hidden border-white/10 animate-fade-in-up">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
                            <UserPlus size={24} />
                        </div>
                        <h2 className="text-lg font-bold text-white">Nuevo Usuario</h2>
                    </div>
                    <button 
                        onClick={resetAndClose} 
                        className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                            Nombre de Usuario <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="admin_sales"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:border-primary-500 outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                            Correo Electrónico <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="email"
                            placeholder="usuario@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:border-primary-500 outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                            Nombre Completo
                        </label>
                        <input
                            type="text"
                            placeholder="Juan Pérez"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:border-primary-500 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                            Contraseña <span className="text-rose-400">*</span>
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:border-primary-500 outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                            Rol Asignado
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {roles.map(role => (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => setSelectedRole(role.id)}
                                    className={`
                                        px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all
                                        ${selectedRole === role.id 
                                            ? 'bg-primary-500/20 text-primary-400 border-primary-500/50' 
                                            : 'bg-white/5 text-slate-500 border-transparent hover:bg-white/10'}
                                    `}
                                >
                                    <Shield size={14} />
                                    {role.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-6">
                        <button
                            type="button"
                            onClick={resetAndClose}
                            className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !username || !email || !password}
                            className="flex-[2] btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed group shadow-glow"
                        >
                            {isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <UserPlus size={18} />
                                    <span>Crear Usuario</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
