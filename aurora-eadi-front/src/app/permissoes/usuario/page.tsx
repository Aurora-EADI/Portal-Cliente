"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { UserRole } from '@/types'
import { UserRegistryPage } from '@/components/pages/permissoes/usuario/UserRegistryPage'

export default function PermissoesPage() {
  const { currentUser, isLoading } = useAuthContext()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // useEffect(() => { 
  //   if (!isMounted || isLoading) return
    
  //   if (!currentUser) {
  //     router.push('/')
  //   } else if (currentUser.role !== UserRole.ADMIN) {
  //     router.push('/supplier')
  //   }
  // }, [currentUser, isLoading, router, isMounted])

  // Evita renderizar no servidor
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // if (!currentUser || currentUser.role !== UserRole.ADMIN) {
  //   return null
  // }

  return (
    <Layout>
      <UserRegistryPage />
    </Layout>
  )
}