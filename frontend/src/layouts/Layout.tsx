import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  ShoppingCart,
  Wrench,
  Package,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  CreditCard,
  History
} from 'lucide-react';
import PermissionGuard from '../components/PermissionGuard';

export default function Layout() {
  const { t } = useTranslation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard'), roles: ['admin', 'vendedor', 'tecnico'] },
    { to: '/pos', icon: ShoppingCart, label: t('sidebar.sales'), roles: ['admin', 'vendedor'] },
    { to: '/sales-history', icon: History, label: t('sidebar.history'), roles: ['admin', 'vendedor'] },
    { to: '/repairs', icon: Wrench, label: t('sidebar.repairs'), roles: ['admin', 'tecnico'] },
    { to: '/inventory', icon: Package, label: t('sidebar.inventory'), roles: ['admin', 'vendedor'] },
    { to: '/finance', icon: CreditCard, label: t('sidebar.finance'), roles: ['admin'] },
    { to: '/customers', icon: Users, label: t('sidebar.customers'), roles: ['admin', 'vendedor'] },
    { to: '/reports', icon: FileText, label: t('sidebar.reports'), roles: ['admin'] },
    { to: '/settings', icon: Settings, label: t('sidebar.settings'), roles: ['admin'] },
  ];

  return (
    <div className="min-h-screen bg-background text-slate-200 flex">
      {/* Mobile Menu Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface border-r border-white/5 
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">ServiceFlow</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <PermissionGuard key={item.to} allowedRoles={item.roles}>
                <NavLink
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-primary-600/10 text-primary-400 border border-primary-600/20 shadow-glow'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </PermissionGuard>
            ))}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-white/5">
            <div className="glass-card p-3 flex items-center justify-between group cursor-pointer hover:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-primary-400 font-bold border border-white/10">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-white truncate max-w-[100px]">{user?.full_name || user?.username || 'Usuario'}</p>
                  <p className="text-xs text-slate-500 capitalize">
                    {user?.roles?.map(r => r.name).join(', ') || user?.role || 'Invitado'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {/* Top Header (Mobile Only / Breadcrumbs) */}
        <header className="lg:hidden h-16 border-b border-white/5 flex items-center padx-6 bg-surface/50 backdrop-blur-xl sticky top-0 z-30 px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400"
          >
            <Menu size={24} />
          </button>
          <span className="ml-4 font-semibold">ServiceFlow Pro</span>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
          {/* Background Texture */}
          <div className="absolute inset-0 z-0 opacity-[0.02] bg-noise pointer-events-none"></div>

          <div className="relative z-10">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
