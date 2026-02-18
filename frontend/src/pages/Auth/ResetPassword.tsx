import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { client } from '../../services/api/client';
import { Lock, Mail, AlertCircle, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import FloatingLabelInput from '../../components/ui/FloatingLabelInput';
import { toast } from 'sonner';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await client.post('auth/forgot-password', { email });
            setIsSuccess(true);
            toast.success('Enlace de recuperación enviado');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error al enviar el enlace');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setIsLoading(true);

        try {
            await client.post('auth/reset-password', { token, new_password: newPassword });
            toast.success('Contraseña actualizada correctamente');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Token inválido o expirado');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex text-white relative overflow-hidden bg-background font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/20 via-background to-background"></div>
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary-500/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full flex items-center justify-center p-6 relative z-20">
                <div className="w-full max-w-md">
                    <div className="glass-card p-8 md:p-10 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl animate-fade-in text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500 shadow-neon mb-6">
                            <Lock className="w-8 h-8 text-white" />
                        </div>

                        {isSuccess ? (
                            <div className="space-y-6">
                                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center gap-3">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                    <h2 className="text-xl font-bold text-white">¡Enviado!</h2>
                                    <p className="text-slate-400 text-sm">
                                        Si la cuenta existe, hemos enviado instrucciones para restablecer tu contraseña a <strong>{email}</strong>.
                                    </p>
                                </div>
                                <Link to="/login" className="flex items-center justify-center gap-2 text-primary-400 hover:text-primary-300 font-bold transition-colors">
                                    <ArrowRight className="rotate-180" size={18} />
                                    Volver al login
                                </Link>
                            </div>
                        ) : token ? (
                            <>
                                <h2 className="text-2xl font-bold text-white mb-2">Nueva Contraseña</h2>
                                <p className="text-slate-400 text-sm mb-8">Ingresa tu nueva clave de acceso</p>

                                {error && (
                                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-left">
                                        <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                                        <p className="text-sm text-rose-300">{error}</p>
                                    </div>
                                )}

                                <form onSubmit={handleResetPassword} className="space-y-6 text-left">
                                    <FloatingLabelInput
                                        label="Nueva Contraseña"
                                        type="password"
                                        icon={Lock}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                    <FloatingLabelInput
                                        label="Confirmar Contraseña"
                                        type="password"
                                        icon={CheckCircle2}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 bg-primary-500 hover:bg-primary-400 text-white font-bold rounded-xl transition-all shadow-neon flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? <RefreshCw className="animate-spin" /> : <span>Actualizar Contraseña</span>}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-white mb-2">¿Olvidaste tu contraseña?</h2>
                                <p className="text-slate-400 text-sm mb-8">Introduce tu correo para recibir un enlace de recuperación</p>

                                {error && (
                                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-left">
                                        <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                                        <p className="text-sm text-rose-300">{error}</p>
                                    </div>
                                )}

                                <form onSubmit={handleForgotPassword} className="space-y-6 text-left">
                                    <FloatingLabelInput
                                        label="Correo Electrónico"
                                        type="email"
                                        icon={Mail}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 bg-primary-500 hover:bg-primary-400 text-white font-bold rounded-xl transition-all shadow-neon flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? <RefreshCw className="animate-spin" /> : <span>Enviar Enlace</span>}
                                    </button>
                                    <div className="text-center">
                                        <Link to="/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors uppercase font-black tracking-widest">
                                            Cancelar y volver
                                        </Link>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
