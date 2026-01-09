'use client'

import { useAuthStore } from '@/store/useAuthStore'
import { Search, Bell, Sun, Moon } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Topbar() {
  const { user } = useAuthStore()
  const router = useRouter()

  return (
    <div className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-x-6 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-950/80 px-6 backdrop-blur-md shadow-sm transition-all">
      <div className="flex flex-1 gap-x-6 self-stretch lg:gap-x-8">
        <form className="relative flex flex-1 items-center" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">Busqueda Global</label>
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="search-field"
              className="block w-full rounded-xl border-0 bg-gray-100/50 dark:bg-gray-900/50 py-2.5 pl-10 pr-4 text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-200 dark:ring-gray-800 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 transition-all"
              placeholder="Buscar..."
              type="search"
              name="search"
            />
          </div>
        </form>
        
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button className="rounded-full p-2.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-500 transition-all">
            <span className="sr-only">Notificaciones</span>
            <Bell className="h-5 w-5" />
          </button>
          
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" aria-hidden="true" />

          {/* User Dropdown / Info */}
          <div className="flex items-center gap-x-4 p-1">
             <div className="hidden text-right sm:block">
                 <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{user?.full_name?.split(' ')[0] || user?.username}</p>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">{user?.roles?.[0]?.name}</p>
             </div>
             <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 shadow-md ring-2 ring-white dark:ring-gray-900">
                {/* Avatar Placeholder */}
                <div className="flex h-full w-full items-center justify-center text-white font-bold text-sm">
                   {user?.full_name?.[0] || 'U'}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
