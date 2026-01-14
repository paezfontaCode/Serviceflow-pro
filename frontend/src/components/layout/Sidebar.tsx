'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingBag, 
  Wrench, 
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Wallet 
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'

const navigation = [
  { name: 'Panel Principal', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'sales', 'vendedor', 'technician', 'tecnico'] },
  { name: 'Ventas (POS)', href: '/dashboard/sales', icon: ShoppingBag, roles: ['admin', 'sales', 'vendedor'] },
  { name: 'Reparaciones', href: '/dashboard/repairs', icon: Wrench, roles: ['admin', 'technician', 'tecnico'] },
  { name: 'Inventario', href: '/dashboard/inventory', icon: Package, roles: ['admin', 'sales', 'technician', 'vendedor', 'tecnico'] },
  { name: 'Clientes', href: '/dashboard/customers', icon: Users, roles: ['admin', 'sales', 'vendedor'] },
  {
    name: 'Finanzas',
    icon: Wallet,
    href: '/dashboard/finance',
    roles: ['admin', 'sales', 'vendedor'], // Sales often need cash opening
    subItems: [
      { name: 'Dashboard', href: '/dashboard/finance', roles: ['admin'] },
      { name: 'Apertura Caja', href: '/dashboard/finance/cash-open', roles: ['admin', 'sales', 'vendedor'] },
      { name: 'Cuentas x Cobrar', href: '/dashboard/finance/receivable', roles: ['admin', 'sales', 'vendedor'] },
      { name: 'Gastos', href: '/dashboard/finance/expenses', roles: ['admin'] },
      { name: 'Cuentas x Pagar', href: '/dashboard/finance/payable', roles: ['admin'] },
    ]
  },
  { name: 'Reportes', href: '/dashboard/reports', icon: BarChart3, roles: ['admin'] },
  {
    name: 'Configuración',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['admin'],
    subItems: [
      { name: 'General', href: '/dashboard/settings', roles: ['admin'] },
      { name: 'Usuarios', href: '/dashboard/settings/users', roles: ['admin'] },
    ]
  },
]

function NavItem({ item, isCollapsed, pathname, userRoles }: { item: any, isCollapsed: boolean, pathname: string, userRoles: string[] }) {
  // Filter subitems if they exist logic
  const visibleSubItems = item.subItems?.filter((sub: any) => 
    !sub.roles || sub.roles.some((role: string) => userRoles.includes(role.toLowerCase()))
  )

  const hasSubItems = visibleSubItems && visibleSubItems.length > 0
  const isActive = pathname === item.href || (hasSubItems && visibleSubItems.some((sub: any) => pathname === sub.href))
  const [isOpen, setIsOpen] = useState(isActive)

  return (
    <li key={item.name}>
      {hasSubItems ? (
        <div className="space-y-1">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "group relative flex w-full items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
              isActive 
                ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-white border border-white/5 shadow-[0_0_20px_rgba(139,92,246,0.1)]" 
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon 
              className={cn(
                "h-5 w-5 shrink-0 transition-colors duration-300",
                isActive ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" : "text-gray-400 group-hover:text-blue-400"
              )} 
            />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.name}</span>
                <ChevronRight className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-90")} />
              </>
            )}
          </button>
          {!isCollapsed && isOpen && (
            <div className="pl-4 ml-3 border-l-2 border-white/5 space-y-1 my-1">
              {visibleSubItems.map((sub: any) => (
                <Link
                  key={sub.name}
                  href={sub.href}
                  className={cn(
                    "block px-3 py-2 text-xs font-medium rounded-lg transition-all duration-300",
                    pathname === sub.href
                      ? "text-white bg-white/10 shadow-sm"
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Link
          href={item.href}
          className={cn(
            "group relative flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
            isActive 
              ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-white border border-white/5 shadow-[0_0_20px_rgba(139,92,246,0.1)]" 
              : "text-gray-400 hover:bg-white/5 hover:text-white"
          )}
          title={isCollapsed ? item.name : undefined}
        >
          {isActive && (
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"
            />
          )}
          <item.icon 
            className={cn(
              "h-5 w-5 shrink-0 transition-colors duration-300",
              isActive ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" : "text-gray-400 group-hover:text-blue-400"
            )} 
          />
          {!isCollapsed && (
            <span className={cn("transition-opacity duration-300", isActive && "font-semibold")}>
              {item.name}
            </span>
          )}
        </Link>
      )}
    </li>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, logout } = useAuthStore()

  // Extract user roles (lowercase)
  const userRoles = user?.roles?.map(r => r.name.toLowerCase()) || []

  // Filter main navigation items
  const filteredNavigation = navigation.filter(item => 
    !item.roles || item.roles.some(role => userRoles.includes(role.toLowerCase()))
  )

  return (
    <motion.div 
      initial={{ width: 256 }}
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "relative flex h-full flex-col border-r border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl transition-all duration-300 z-50",
        // Enhanced border glow
        "after:absolute after:inset-y-0 after:right-0 after:w-[1px] after:bg-gradient-to-b after:from-transparent after:via-white/10 after:to-transparent"
      )}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-gray-900 text-gray-400 shadow-lg hover:bg-gray-800 hover:text-white hover:scale-110 hover:border-blue-500/50 transition-all duration-300"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      <div className="flex h-24 items-center justify-center px-6 relative overflow-hidden">
        {/* Logo Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />
        
        <motion.div 
          className="flex items-center gap-3 relative z-10"
          animate={{ opacity: 1 }}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/25 ring-1 ring-white/10">
            <Wrench className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col"
            >
              <span className="text-lg font-bold text-white tracking-tight leading-none">
                ServiceFlow
              </span>
              <span className="text-[10px] font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 uppercase tracking-wider">
                Pro System v2
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 scrollbar-none space-y-6">
        <div>
          {!isCollapsed && <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">Menu Principal</h3>}
          <ul role="list" className="space-y-2">
            {filteredNavigation.map((item) => (
              <NavItem key={item.name} item={item} isCollapsed={isCollapsed} pathname={pathname} userRoles={userRoles} />
            ))}
          </ul>
        </div>
      </nav>

      <div className="p-4 border-t border-white/5 bg-gradient-to-t from-black/20 to-transparent">
         <button
            onClick={() => {
              logout()
              window.location.href = '/login' // Force full reload to clear any in-memory state
            }}
            className={cn(
              "group flex w-full items-center gap-x-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-400 transition-all hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20",
              isCollapsed && "justify-center"
            )}
            title="Cerrar Sesión"
         >
          <LogOut className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-x-1" />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </motion.div>
  )
}
