'use client'

import { useAuthStore } from '@/store/useAuthStore'
import { Search, Bell, Menu } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Topbar() {
  const { user } = useAuthStore()
  const router = useRouter()

  return (
    <div className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between gap-x-6 px-6 lg:px-8 transition-all">
      {/* Glass Background Panel */}
      <div className="absolute inset-0 bg-[#0a0a0f]/60 backdrop-blur-md border-b border-white/5 w-full h-full pointer-events-none" />

      <div className="relative flex flex-1 gap-x-6 items-center z-10">
        <div className="flex items-center lg:hidden">
            <button className="-m-2.5 p-2.5 text-gray-400 hover:text-white">
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
        </div>

        <form className="relative flex flex-1 max-w-lg" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">Busqueda Global</label>
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              id="search-field"
              className="block w-full rounded-2xl border border-white/5 bg-white/[0.03] py-2.5 pl-11 pr-4 text-gray-200 placeholder:text-gray-600 focus:bg-white/[0.06] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 sm:text-sm sm:leading-6 transition-all duration-300 shadow-sm"
              placeholder="Buscar clientes, reparaciones, facturas..."
              type="search"
              name="search"
            />
          </div>
        </form>
        
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button className="relative rounded-xl p-2.5 text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-300 group">
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0a0a0f] animate-pulse"></span>
            <span className="sr-only">Notificaciones</span>
            <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>
          
          <div className="h-8 w-px bg-white/10" aria-hidden="true" />

          {/* User Dropdown / Info */}
          <div className="flex items-center gap-x-4 p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5 pr-4">
             <div className="h-9 w-9 overflow-hidden rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 ring-2 ring-white/10 shadow-lg shadow-purple-500/20">
                <div className="flex h-full w-full items-center justify-center text-white font-bold text-xs">
                   {user?.full_name?.[0] || 'U'}
                </div>
             </div>
             <div className="hidden text-left sm:block">
                 <p className="text-sm font-semibold text-white leading-none">{user?.full_name?.split(' ')[0] || user?.username}</p>
                 <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-medium">{user?.roles?.[0]?.name}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
