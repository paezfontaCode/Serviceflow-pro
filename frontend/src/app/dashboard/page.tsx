'use client'

import { useAuthStore } from '@/store/useAuthStore'
import AdminDashboard from '@/components/dashboard/AdminDashboard'
import SalesDashboard from '@/components/dashboard/SalesDashboard'
import TechnicianDashboard from '@/components/dashboard/TechnicianDashboard'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  // Helper to check roles safely
  const hasRole = (roleName: string) => {
    return user?.roles?.some(r => r.name.toLowerCase() === roleName.toLowerCase())
  }

  // Priority: Admin > Technician > Sales
  // This allows an admin to see the full dashboard even if they also have other roles.
  
  if (hasRole('admin')) {
    return <AdminDashboard />
  }

  if (hasRole('technician') || hasRole('tecnico')) {
    return <TechnicianDashboard />
  }

  if (hasRole('sales') || hasRole('vendedor')) {
    return <SalesDashboard />
  }

  // Default fallback (or unauthorized view if strict)
  return <SalesDashboard />
}
