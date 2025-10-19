'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface QuotaData {
  storage_bytes: number
  storage_limit: number
  plan: string
}

export default function UsageMeter() {
  const { data: session } = useSession()
  const [quota, setQuota] = useState<QuotaData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.email) return

    const fetchQuota = async () => {
      try {
        const response = await fetch('/api/quota')
        if (response.ok) {
          const data = await response.json()
          setQuota(data)
        }
      } catch (error) {
        console.error('Failed to fetch quota:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuota()
  }, [session])

  if (loading || !quota) {
    return <div className="text-sm text-gray-500">Loading usage...</div>
  }

  const usedGB = quota.storage_bytes / (1024 * 1024 * 1024)
  const totalGB = quota.storage_limit / (1024 * 1024 * 1024)
  const percentage = (quota.storage_bytes / quota.storage_limit) * 100

  const getColor = () => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Storage Usage</span>
        <span>{usedGB.toFixed(2)} GB / {totalGB.toFixed(0)} GB</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${getColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="text-xs text-gray-500">
        Plan: {quota.plan} • {percentage.toFixed(1)}% used
      </div>
    </div>
  )
}
