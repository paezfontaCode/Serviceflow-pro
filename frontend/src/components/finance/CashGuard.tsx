'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFinanceStore } from '@/store/useFinanceStore'
import { Loader2 } from 'lucide-react'

export default function CashGuard({ children }: { children: React.ReactNode }) {
  const { currentSession, fetchCurrentSession, isLoading } = useFinanceStore()
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      await fetchCurrentSession()
      setIsInitialized(true)
    }
    init()
  }, [fetchCurrentSession])

  useEffect(() => {
    if (isInitialized && !isLoading && !currentSession) {
      router.push('/dashboard/finance/cash-open')
    }
  }, [currentSession, isLoading, router, isInitialized])

  if (!isInitialized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!currentSession) {
    return null
  }

  return <>{children}</>
}
