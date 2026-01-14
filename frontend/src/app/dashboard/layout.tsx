import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-transparent">
      <div className="sticky top-0 h-screen shrink-0 z-50">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden relative">
        <Topbar />
        
        <main className="flex-1 overflow-auto py-8 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
