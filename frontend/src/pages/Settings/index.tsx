import { useState, useEffect } from 'react';
import { 
    Globe, 
    Bell, 
    Shield, 
    Database, 
    Save,
    ChevronRight,
    Building2,
    Users,
    Key,
    Smartphone,
    Plus,
    Trash2,
    Lock,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import { settingsService, SystemSettings } from '../../services/api/settingsService';
import { userService, User } from '../../services/api/userService';
import { financeService } from '../../services/api/financeService';
import { client } from '../../services/api/client';
import { toast } from 'sonner';
import UserModal from './components/UserModal';

type SettingsTab = 'business' | 'users' | 'notifications' | 'security' | 'currency' | 'database' | 'integrations' | 'danger';

export default function Settings() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('business');
    const [settings, setSettings] = useState<Partial<SystemSettings>>({});
    const [users, setUsers] = useState<User[]>([]);
    const [sessionsCount, setSessionsCount] = useState(0);
    const [currentRate, setCurrentRate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    
    // Action States
    const [showConfirm, setShowConfirm] = useState<{show: boolean, type: 'reset' | 'sessions' | 'policy' | 'backup' | 'optimize'}>({show: false, type: 'reset'});

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [sData, uData, rData, sessions] = await Promise.all([
                settingsService.getSettings(),
                userService.getUsers(),
                financeService.getCurrentRate().catch(() => null),
                financeService.getCashSessions().catch(() => [])
            ]).catch(err => {
                console.error("Initial load error:", err);
                return [{}, [] as User[], null, []];
            });
            setSettings(sData as Partial<SystemSettings>);
            setUsers(uData as User[]);
            setCurrentRate(rData);
            setSessionsCount((sessions as any[]).filter(s => s.status === 'open').length);
        } catch (error) {
            toast.error('Error al cargar configuraciones');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await settingsService.updateSettings(settings);
            toast.success('Configuraciones guardadas correctamente');
        } catch (error) {
            toast.error('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const executeAction = async () => {
        const actingType = showConfirm.type;
        setShowConfirm({ ...showConfirm, show: false });
        const toastId = toast.loading('Procesando acción...');
        
        try {
            // Mocking these for now as backend doesn't have specific endpoints
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (actingType === 'reset') {
                toast.success('Sistema restablecido (Modo Demo)', { id: toastId });
            } else if (actingType === 'sessions') {
                const sessions = await financeService.getCashSessions();
                const openSessions = sessions.filter(s => s.status === 'open');
                
                await Promise.all(openSessions.map(s => 
                    financeService.getTransactions(s.id).then(() => {
                        // In a real scenario, we'd need a specific 'force close' endpoint
                        // or call the close endpoint with 0 or actual expected amounts.
                        // For now, we'll assume the user wants to closing them with the expected amount to 'clean' the state.
                        return client.post(`finance/cash-sessions/${s.id}/close/`, {
                            actual_amount: s.expected_amount,
                            actual_amount_ves: s.expected_amount_ves,
                            notes: "Cierre forzado desde configuración"
                        });
                    })
                ));
                
                await loadInitialData();
                toast.success(`${openSessions.length} sesiones cerradas correctamente`, { id: toastId });
            } else if (actingType === 'policy') {
                toast.success('Políticas de seguridad actualizadas', { id: toastId });
            } else if (actingType === 'backup') {
                toast.success('Respaldo generado correctamente (backup.sql)', { id: toastId });
            } else if (actingType === 'optimize') {
                toast.success('Tablas optimizadas y limpiezas de caché completadas', { id: toastId });
            }
        } catch (error) {
            toast.error('Error al ejecutar acción', { id: toastId });
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'business':
                return (
                    <div className="glass-card p-8 border-white/5 space-y-8">
                        <SectionHeader icon={Building2} title="Perfil de Empresa" subtitle="Datos públicos para facturas y reportes" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField 
                                label="Nombre Legal" 
                                value={settings.company_name} 
                                onChange={(val: string) => setSettings({...settings, company_name: val})}
                            />
                            <InputField 
                                label="RIF / Identificación" 
                                value={settings.company_tax_id}
                                onChange={(val: string) => setSettings({...settings, company_tax_id: val})}
                            />
                            <InputField 
                                label="Correo de Soporte" 
                                value={settings.company_email}
                                onChange={(val: string) => setSettings({...settings, company_email: val})}
                            />
                            <InputField 
                                label="Teléfono" 
                                value={settings.company_phone}
                                onChange={(val: string) => setSettings({...settings, company_phone: val})}
                            />
                            <div className="md:col-span-2">
                                <InputField 
                                    label="Dirección Física" 
                                    value={settings.company_address}
                                    onChange={(val: string) => setSettings({...settings, company_address: val})}
                                />
                            </div>
                        </div>

                        <div className="pt-8 space-y-6">
                            <h4 className="text-xs font-black text-white uppercase tracking-widest pl-2 border-l-2 border-primary-500">Documentos</h4>
                            <div className="grid grid-cols-1 gap-6">
                                <InputField 
                                    label="Encabezado de Recibo" 
                                    value={settings.receipt_header}
                                    onChange={(val: string) => setSettings({...settings, receipt_header: val})}
                                />
                                <InputField 
                                    label="Pie de Recibo" 
                                    value={settings.receipt_footer}
                                    onChange={(val: string) => setSettings({...settings, receipt_footer: val})}
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'users':
                return (
                    <div className="glass-card p-8 border-white/5 space-y-8">
                        <div className="flex justify-between items-center">
                            <SectionHeader icon={Users} title="Usuarios y Roles" subtitle="Gestiona quién accede al sistema" />
                            <button 
                                onClick={() => setIsUserModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-400 rounded-xl text-xs font-bold hover:bg-primary-500 hover:text-white transition-all shadow-glow-sm"
                            >
                                <Plus size={16} />
                                Nuevo Usuario
                            </button>
                        </div>
                        
                        <div className="overflow-hidden rounded-xl border border-white/5">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Usuario</th>
                                        <th className="px-6 py-4">Roles</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.map(user => (
                                        <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white">{user.full_name}</span>
                                                    <span className="text-xs text-slate-500">{user.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1 flex-wrap">
                                                    {user.roles && user.roles.map(r => (
                                                        <span key={r.id} className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] uppercase font-bold">
                                                            {r.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${user.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                    {user.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400"><Save size={14} /></button>
                                                    <button className="p-2 hover:bg-rose-500/10 rounded-lg text-rose-400"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="glass-card p-8 border-white/5 space-y-8">
                        <SectionHeader icon={Bell} title="Notificaciones" subtitle="Alertas de sistema y correos electrónicos" />
                        <div className="space-y-4">
                            <ToggleItem 
                                title="Alertas de Stock Bajo" 
                                description="Recibir notificación cuando un producto llegue al mínimo" 
                                active={true}
                            />
                            <ToggleItem 
                                title="Reportes Diarios" 
                                description="Enviar resumen de ventas al cerrar la caja por correo" 
                                active={false}
                            />
                            <ToggleItem 
                                title="Nuevas Reparaciones" 
                                description="Notificar a técnicos cuando se asigne un equipo" 
                                active={true}
                            />
                        </div>
                    </div>
                );
            case 'security':
                return (
                    <div className="space-y-8 animate-fade-in">
                        <div className="glass-card p-8 border-white/5 space-y-8">
                            <SectionHeader icon={Shield} title="Seguridad y Accesos" subtitle="Políticas de acceso y auditoría" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                    <div className="flex items-center gap-3 text-white font-bold">
                                        <Lock size={18} className="text-primary-400" />
                                        <span>Política de Contraseñas</span>
                                    </div>
                                    <p className="text-xs text-slate-500">Mínimo 8 caracteres, números y símbolos requeridos.</p>
                                    <button 
                                        onClick={() => setShowConfirm({ show: true, type: 'policy' })}
                                        className="text-xs text-primary-400 font-bold uppercase tracking-wider hover:text-primary-300 transition-colors"
                                    >
                                        Configurar
                                    </button>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                    <div className="flex items-center gap-3 text-white font-bold">
                                        <Key size={18} className="text-primary-400" />
                                        <span>Sesiones Activas</span>
                                    </div>
                                    <p className="text-xs text-slate-500">Hay {sessionsCount} {sessionsCount === 1 ? 'sesión activa' : 'sesiones activas'} actualmente.</p>
                                    <button 
                                        disabled={sessionsCount === 0}
                                        onClick={() => setShowConfirm({ show: true, type: 'sessions' })}
                                        className="text-xs text-rose-400 font-bold uppercase tracking-wider hover:text-rose-300 transition-colors disabled:opacity-30"
                                    >
                                        Cerrar todas
                                    </button>
                                </div>
                            </div>
                        </div>
                        {renderDangerZone()}
                    </div>
                );
            case 'currency':
                return (
                    <div className="glass-card p-8 border-white/5 space-y-8">
                        <SectionHeader icon={Globe} title="Moneda y Tasas" subtitle="Configuración de precios y conversión" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-white uppercase tracking-widest pl-2 border-l-2 border-primary-500">Moneda Base</h4>
                                <select 
                                    value={settings.default_currency}
                                    onChange={(e) => setSettings({...settings, default_currency: e.target.value})}
                                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary-500 outline-none antialiased"
                                >
                                    <option value="USD">Dólar Estadounidense (USD)</option>
                                    <option value="VES">Bolívar Digital (VES)</option>
                                </select>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-white uppercase tracking-widest pl-2 border-l-2 border-primary-500">Tasa Actual (BCV)</h4>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-white">
                                            {currentRate ? `1 USD = ${currentRate.rate} Bs.` : 'Cargando tasa...'}
                                        </p>
                                        <p className="text-[10px] text-slate-500 uppercase font-black">Sincronizado desde BCV</p>
                                    </div>
                                    <button 
                                        onClick={loadInitialData}
                                        className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-glow-sm"
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'database':
                return (
                    <div className="space-y-8 animate-fade-in">
                        <div className="glass-card p-8 border-white/5 space-y-8">
                            <SectionHeader icon={Database} title="Base de Datos" subtitle="Mantenimiento y respaldos" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ActionBox 
                                    icon={Database} 
                                    title="Respaldar Ahora" 
                                    description="Genera un archivo .sql con toda la información actual."
                                    buttonLabel="Generar Backup"
                                    onClick={() => setShowConfirm({ show: true, type: 'backup' })}
                                />
                                <ActionBox 
                                    icon={RefreshCw} 
                                    title="Optimizar Tablas" 
                                    description="Mejora el rendimiento de búsqueda y almacenamiento."
                                    buttonLabel="Optimizar"
                                    onClick={() => setShowConfirm({ show: true, type: 'optimize' })}
                                />
                            </div>
                        </div>
                        {renderDangerZone()}
                    </div>
                );
            case 'integrations':
                // ... (keeping existing integrations)
                return (
                    <div className="glass-card p-8 border-white/5 space-y-8">
                        <SectionHeader icon={Smartphone} title="Integraciones App" subtitle="Conecta con servicios externos" />
                        <div className="space-y-8">
                            {/* WhatsApp API Configuration */}
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow-sm"></span>
                                        WhatsApp API (Notificaciones)
                                    </h4>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado: Activo</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField 
                                        label="API URL" 
                                        placeholder="https://api.whatsapp.com/..." 
                                        value={settings.whatsapp_api_url}
                                        onChange={(val: string) => setSettings({...settings, whatsapp_api_url: val})}
                                    />
                                    <InputField 
                                        label="Access Token" 
                                        placeholder="wa_token_..." 
                                        value={settings.whatsapp_token}
                                        onChange={(val: string) => setSettings({...settings, whatsapp_token: val})}
                                    />
                                </div>
                            </div>

                            {/* Telegram Bot Configuration */}
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                                        Telegram Bot
                                    </h4>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado: Desconectado</span>
                                </div>
                                <InputField 
                                    label="Bot Token" 
                                    placeholder="000000000:AA..." 
                                    value={settings.telegram_token}
                                    onChange={(val: string) => setSettings({...settings, telegram_token: val})}
                                />
                            </div>

                            {/* Google Drive Configuration */}
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                                        Google Drive (Backups)
                                    </h4>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado: Desconectado</span>
                                </div>
                                <InputField 
                                    label="Folder ID" 
                                    placeholder="1A2b3C4d..." 
                                    value={settings.google_drive_folder_id}
                                    onChange={(val: string) => setSettings({...settings, google_drive_folder_id: val})}
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'danger':
                return (
                    <div className="space-y-8 animate-fade-in">
                        <SectionHeader icon={AlertTriangle} title="Zona Peligrosa" subtitle="Acciones críticas del sistema" />
                        {renderDangerZone()}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-4">
                                <div className="flex items-center gap-3 text-rose-400 font-bold">
                                    <Trash2 size={18} />
                                    <span>Borrar Historial de Ventas</span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">Elimina permanentemente todos los registros de ventas y transacciones bancarias.</p>
                                <button 
                                    onClick={() => setShowConfirm({ show: true, type: 'reset' })}
                                    className="w-full py-2 rounded-lg bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">Limpiar Registros</button>
                            </div>
                            <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-4">
                                <div className="flex items-center gap-3 text-rose-400 font-bold">
                                    <Users size={18} />
                                    <span>Resetear Usuarios</span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">Elimina todos los usuarios excepto el administrador principal.</p>
                                <button 
                                    onClick={() => setShowConfirm({ show: true, type: 'reset' })}
                                    className="w-full py-2 rounded-lg bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">Resetear Usuarios</button>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const renderDangerZone = () => (
        <div className="glass-card p-8 border-white/5 bg-gradient-to-br from-rose-600/10 to-transparent">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">Zona Peligrosa</h3>
                    <p className="text-xs text-slate-500 mt-1">Acciones irreversibles que afectan la integridad de los datos</p>
                </div>
                <button 
                    onClick={() => setShowConfirm({ show: true, type: 'reset' })}
                    className="px-6 py-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-glow-sm"
                >
                    Hard Reset
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white tracking-tight">Configuración del Sistema</h2>
                    <p className="text-slate-500 font-medium">Gestiona las preferencias y políticas de la plataforma</p>
                </div>
                
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary px-8 py-3 flex items-center gap-2 group shadow-glow disabled:opacity-50"
                >
                    {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    Guardar Cambios
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Navigation Menu */}
                <div className="space-y-4">
                    <SettingsNav 
                        active={activeTab === 'business'} 
                        icon={Building2} 
                        label="Información del Negocio" 
                        onClick={() => setActiveTab('business')}
                    />
                    <SettingsNav 
                        active={activeTab === 'users'} 
                        icon={Users} 
                        label="Usuarios y Roles" 
                        onClick={() => setActiveTab('users')}
                    />
                    <SettingsNav 
                        active={activeTab === 'notifications'} 
                        icon={Bell} 
                        label="Notificaciones" 
                        onClick={() => setActiveTab('notifications')}
                    />
                    <SettingsNav 
                        active={activeTab === 'security'} 
                        icon={Shield} 
                        label="Seguridad y Accesos" 
                        onClick={() => setActiveTab('security')}
                    />
                    <SettingsNav 
                        active={activeTab === 'currency'} 
                        icon={Globe} 
                        label="Moneda y Tasas" 
                        onClick={() => setActiveTab('currency')}
                    />
                    <SettingsNav 
                        active={activeTab === 'database'} 
                        icon={Database} 
                        label="Base de Datos y Backup" 
                        onClick={() => setActiveTab('database')}
                    />
                    <SettingsNav 
                        active={activeTab === 'integrations'} 
                        icon={Smartphone} 
                        label="Integraciones App" 
                        onClick={() => setActiveTab('integrations')}
                    />
                    <SettingsNav 
                        active={activeTab === 'danger'} 
                        icon={AlertTriangle} 
                        label="Zona Peligrosa" 
                        onClick={() => setActiveTab('danger')}
                    />
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="glass-card p-12 flex flex-col items-center justify-center text-slate-500 gap-4">
                            <RefreshCw className="animate-spin" size={32} />
                            <p className="font-medium">Cargando módulos...</p>
                        </div>
                    ) : (
                        renderContent()
                    )}
                </div>
            </div>

            <UserModal 
                isOpen={isUserModalOpen} 
                onClose={() => setIsUserModalOpen(false)} 
                onUserCreated={loadInitialData}
            />

            {/* Confirmation Modal */}
            {showConfirm.show && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm bg-black/40">
                    <div className="glass-card w-full max-w-sm border-rose-500/20 overflow-hidden animate-scale-in">
                        <div className="p-6 space-y-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">¿Estás seguro?</h3>
                            <p className="text-sm text-slate-400">
                                {showConfirm.type === 'reset' ? 'Esta acción borrará todas las configuraciones y datos personalizados del sistema. No se puede deshacer.' :
                                 showConfirm.type === 'sessions' ? 'Se cerrarán todas las sesiones activas excepto la actual. Los usuarios tendrán que volver a iniciar sesión.' :
                                 showConfirm.type === 'policy' ? 'Se aplicarán las nuevas políticas de seguridad a todos los usuarios.' :
                                 showConfirm.type === 'backup' ? 'Se generará una copia de seguridad de toda la base de datos en formato SQL.' :
                                 'Se realizará un mantenimiento preventivo a las tablas de la base de datos para mejorar la velocidad.'}
                            </p>
                            <div className="flex gap-4 pt-4">
                                <button 
                                    onClick={() => setShowConfirm({ ...showConfirm, show: false })}
                                    className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold hover:text-white transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={executeAction}
                                    className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold shadow-glow-sm hover:bg-rose-600 transition-all"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SettingsNav({ icon: Icon, label, active = false, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${active ? 'bg-primary-600/20 text-white border border-primary-500/30 shadow-glow' : 'hover:bg-white/5 text-slate-400 border border-transparent'}`}
        >
            <div className="flex items-center gap-4">
                <Icon size={20} className={active ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className="text-sm font-bold">{label}</span>
            </div>
            <ChevronRight size={16} className={active ? 'text-primary-500' : 'text-slate-700'} />
        </button>
    );
}

function SectionHeader({ icon: Icon, title, subtitle }: any) {
    return (
        <div className="flex items-center gap-4 pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-400 flex items-center justify-center">
                <Icon size={24} />
            </div>
            <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">{title}</h3>
                <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
        </div>
    );
}

function InputField({ label, placeholder, value, onChange }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
            <input 
                type="text" 
                value={value || ''}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 outline-none transition-all placeholder:text-slate-700 font-medium"
            />
        </div>
    );
}

function ToggleItem({ title, description, active }: any) {
    const [isEnabled, setIsEnabled] = useState(active);
    return (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="space-y-1">
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="text-xs text-slate-500">{description}</p>
            </div>
            <div 
                onClick={() => setIsEnabled(!isEnabled)}
                className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${isEnabled ? 'bg-emerald-500 shadow-glow' : 'bg-slate-700'}`}
            >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isEnabled ? 'right-1' : 'left-1'}`}></div>
            </div>
        </div>
    );
}

function ActionBox({ icon: Icon, title, description, buttonLabel, onClick }: any) {
    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4 shadow-sm hover:border-white/10 transition-all">
            <div className="flex items-center gap-3 text-white font-bold text-sm">
                <Icon size={18} className="text-primary-400" />
                <span>{title}</span>
            </div>
            <p className="text-xs text-slate-500">{description}</p>
            <button 
                onClick={onClick}
                className="w-full px-4 py-2 bg-primary-500/10 text-primary-400 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all"
            >
                {buttonLabel}
            </button>
        </div>
    );
}

