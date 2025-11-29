"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { SupplierDashboard } from '@/components/pages/supplier/Dashboard'
import { UserRole } from '@/types'

export default function SupplierPage() {
  const { currentUser, isLoading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    
    if (!currentUser) {
      router.push('/')
    } else if (currentUser.role !== UserRole.SUPPLIER) {
      router.push('/admin')
    }
  }, [currentUser, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!currentUser || currentUser.role !== UserRole.SUPPLIER) {
    return null
  }

  return (
    <Layout>
      <SupplierDashboard />
    </Layout>
  )
}