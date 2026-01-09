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
  { name: 'Panel Principal', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Ventas (POS)', href: '/dashboard/sales', icon: ShoppingBag },
  { name: 'Reparaciones', href: '/dashboard/repairs', icon: Wrench },
  { name: 'Inventario', href: '/dashboard/inventory', icon: Package },
  { name: 'Clientes', href: '/dashboard/customers', icon: Users },
  {
    name: 'Finanzas',
    icon: Wallet,
    href: '/dashboard/finance',
    subItems: [
      { name: 'Dashboard', href: '/dashboard/finance' },
      { name: 'Apertura Caja', href: '/dashboard/finance/cash-open' },
      { name: 'Cuentas x Cobrar', href: '/dashboard/finance/receivable' },
      { name: 'Gastos', href: '/dashboard/finance/expenses' },
      { name: 'Cuentas x Pagar', href: '/dashboard/finance/payable' },
    ]
  },
  { name: 'Reportes', href: '/dashboard/reports', icon: BarChart3 },
  {
    name: 'Configuración',
    href: '/dashboard/settings',
    icon: Settings,
    subItems: [
      { name: 'General', href: '/dashboard/settings' },
      { name: 'Usuarios', href: '/dashboard/settings/users' },
    ]
  },
]

function NavItem({ item, isCollapsed, pathname }: { item: any, isCollapsed: boolean, pathname: string }) {
  const isActive = pathname === item.href || (item.subItems?.some((sub: any) => pathname === sub.href))
  const [isOpen, setIsOpen] = useState(isActive)

  return (
    <li key={item.name}>
      {item.subItems ? (
        <div className="space-y-1">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "group relative flex w-full items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-white/10 text-white shadow-lg shadow-black/5" 
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon 
              className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                isActive ? "text-blue-400" : "text-gray-400 group-hover:text-blue-400"
              )} 
            />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.name}</span>
                <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
              </>
            )}
          </button>
          {!isCollapsed && isOpen && (
            <div className="pl-11 space-y-1">
              {item.subItems.map((sub: any) => (
                <Link
                  key={sub.name}
                  href={sub.href}
                  className={cn(
                    "block px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                    pathname === sub.href
                      ? "text-white bg-white/5"
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
            "group relative flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive 
              ? "bg-white/10 text-white shadow-lg shadow-black/5" 
              : "text-gray-400 hover:bg-white/5 hover:text-white"
          )}
          title={isCollapsed ? item.name : undefined}
        >
          {isActive && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-white/5"
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <item.icon 
            className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              isActive ? "text-blue-400" : "text-gray-400 group-hover:text-blue-400"
            )} 
          />
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {item.name}
            </motion.span>
          )}
        </Link>
      )}
    </li>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { logout } = useAuthStore()

  return (
    <motion.div 
      initial={{ width: 256 }}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "relative flex h-full flex-col border-r border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl transition-all duration-300",
        "dark:from-gray-900 dark:to-gray-950 dark:bg-gradient-to-b"
      )}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-gray-800 text-white shadow-lg hover:bg-gray-700 hover:scale-110 transition-all"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      <div className="flex h-20 items-center justify-center border-b border-white/5 px-6">
        <motion.div 
          className="flex items-center gap-2 overflow-hidden"
          animate={{ opacity: 1 }}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/20">
            <span className="text-lg font-bold text-white">S</span>
          </div>
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="whitespace-nowrap text-xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
            >
              ServiceFlow
            </motion.span>
          )}
        </motion.div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-6 scrollbar-none">
        <ul role="list" className="space-y-2">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} isCollapsed={isCollapsed} pathname={pathname} />
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/5 p-3">
        <button
           onClick={() => logout()}
           className={cn(
             "group flex w-full items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 transition-all hover:bg-red-500/10 hover:text-red-400",
             isCollapsed && "justify-center"
           )}
           title="Cerrar Sesión"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </motion.div>
  )
}
