// app/modules/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/context/AuthContext'
import { ModulesPage } from '@/components/pages/modules/ModulePage'
import { Header } from '@/components/layout/Header'
import { Layout } from '@/components/layout/Layout'

export default function Modules() {
  const { currentUser, isLoading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push('/')
    }
  }, [currentUser, isLoading, router])

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <Layout>
        <ModulesPage />
      </Layout>
    </div>
  );
}