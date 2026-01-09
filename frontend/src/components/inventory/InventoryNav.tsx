'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, Users, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'

export function InventoryNav() {
  const pathname = usePathname()

  const tabs = [
    { name: 'Productos', href: '/dashboard/inventory', icon: Package, exact: true },
    { name: 'Categorías', href: '/dashboard/inventory/categories', icon: Package, exact: false },
    { name: 'Proveedores', href: '/dashboard/inventory/suppliers', icon: Users, exact: false },
    { name: 'Compras', href: '/dashboard/inventory/purchases', icon: ShoppingCart, exact: false },
  ]

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.exact 
            ? pathname === tab.href 
            : pathname.startsWith(tab.href)
          
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                isActive
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              )}
            >
              <tab.icon
                className={cn(
                  "-ml-0.5 mr-2 h-5 w-5",
                  isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                )}
                aria-hidden="true"
              />
              <span>{tab.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
