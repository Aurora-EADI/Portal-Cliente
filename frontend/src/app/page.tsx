"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/context/AuthContext'
import { Login } from '@/components/pages/Login'

export default function HomePage() {
  const { currentUser, isLoading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    // Todo perfil inicia no dashboard de agendamento: a seleção de módulos
    // saiu, e a API recusava a listagem para quem não é ADMIN.
    if (!isLoading && currentUser) {
      router.push('/agendamento')
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
