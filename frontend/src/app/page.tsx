"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/context/AuthContext'
import { Login } from '@/components/pages/Login'
import { UserRole } from '@/types'

export default function HomePage() {
  const { currentUser, isLoading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && currentUser) {
      // CLIENTE vai direto para o portal de agendamento
      if (currentUser.role === UserRole.CLIENTE) {
        router.push('/agendamento')
      } else {
        router.push('/modules')
      }
    }
  }, [currentUser, isLoading, router])

  if (isLoading || currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return <Login />
}