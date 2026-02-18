import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { client } from '../../services/api/client';
import { Wrench, Lock, User, AlertCircle, ArrowRight, Zap } from 'lucide-react';

import FloatingLabelInput from '../../components/ui/FloatingLabelInput';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Zustand Store
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const { data } = await client.post('auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            // Fetch Current User
            const userResponse = await client.get('auth/me', {
                headers: { Authorization: `Bearer ${data.access_token}` }
            });

            setAuth(data.access_token, data.refresh_token, userResponse.data);
            navigate('/dashboard');
        } catch (err: any) {
            let errorMessage = 'Credenciales inválidas';

            if (err.response?.data) {
                const data = err.response.data;
                if (data.detail && Array.isArray(data.detail)) {
                    errorMessage = data.detail.map((e: any) => e.msg).join(', ');
                } else if (typeof data.detail === 'string') {
                    errorMessage = data.detail;
                } else if (data.message) {
                    errorMessage = data.message;
                }
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex text-white relative overflow-hidden bg-background font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/20 via-background to-background"></div>
                {/* Floating Orbs */}
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
            </div>

            {/* Left Panel - Visual (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center px-16 xl:px-24">

                <div className="relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 w-fit animate-fade-in-up">
                        <span className="flex h-2 w-2 rounded-full bg-success animate-pulse"></span>
                        <span className="text-xs font-medium text-slate-300">Sistema Operativo v2.0</span>
                    </div>

                    <h1 className="text-5xl xl:text-7xl font-bold tracking-tight mb-6 leading-tight animate-fade-in-up delay-100">
                        Gestión Técnica <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">Inteligente</span>
                    </h1>

                    <p className="text-lg text-slate-400 max-w-lg mb-8 leading-relaxed animate-fade-in-up delay-200">
                        Optimiza tu taller con ServiceFlow. Control total sobre reparaciones, inventario y ventas en una interfaz diseñada para profesionales.
                    </p>

                    <div className="flex gap-4 animate-fade-in-up delay-300">
                        <div className="glass-card p-4 rounded-2xl flex items-center gap-4 min-w-[180px]">
                            <div className="p-3 bg-primary-500/20 rounded-xl text-primary-400">
                                <Zap size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">99.9%</p>
                                <p className="text-xs text-slate-400">Uptime</p>
                            </div>
                        </div>
                        <div className="glass-card p-4 rounded-2xl flex items-center gap-4 min-w-[180px]">
                            <div className="p-3 bg-secondary-500/20 rounded-xl text-secondary-500">
                                <Wrench size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">+500</p>
                                <p className="text-xs text-slate-400">Reparaciones</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative z-20">
                <div className="w-full max-w-md">
                    {/* Glass Card Container */}
                    <div className="glass-card p-8 md:p-10 rounded-3xl relative overflow-hidden backdrop-blur-xl border border-white/10 shadow-2xl animate-fade-in">

                        {/* Header */}
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 shadow-neon mb-6 transform hover:scale-105 transition-transform duration-500">
                                <Wrench className="w-8 h-8 text-white" strokeWidth={2} />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Bienvenido de nuevo</h2>
                            <p className="text-slate-400 text-sm">Ingresa tus credenciales para acceder al panel</p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 animate-pulse">
                                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-semibold text-rose-400">Error de acceso</p>
                                    <p className="text-rose-300/80">{error}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <FloatingLabelInput
                                label="Usuario"
                                type="text"
                                icon={User}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />

                            <FloatingLabelInput
                                label="Contraseña"
                                type="password"
                                icon={Lock}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="rounded bg-slate-800 border-slate-700 text-primary-500 focus:ring-primary-500/50 transition-colors" />
                                    <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Recordarme</span>
                                </label>
                                <Link to="/forgot-password" title="Click para recuperar contraseña" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white font-bold rounded-xl transition-all duration-300 shadow-neon group flex items-center justify-center gap-2 disabled:opacity-70 disabled:filter disabled:grayscale"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Iniciar Sesión</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer Links */}
                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                            <p className="text-sm text-slate-500">
                                ¿No tienes cuenta?{' '}
                                <span className="text-slate-400 font-medium cursor-not-allowed" title="Contacta al administrador">
                                    Contacta al Admin
                                </span>
                            </p>
                        </div>
                    </div>
                    <p className="text-center text-xs text-slate-600 mt-6 font-mono">
                        ServiceFlow Pro v2.0 • 2024
                    </p>
                </div>
            </div>
        </div>
    );
}
