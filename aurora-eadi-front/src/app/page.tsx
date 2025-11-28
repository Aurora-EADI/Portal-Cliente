"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/context/AuthContext'
import { Login } from '@/components/pages/Login'
import { Register } from '@/components/pages/Register'


export default function HomePage() {
  const { currentUser, isLoading } = useAuthContext()
  const [view, setView] = useState<'login' | 'register'>('login')
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && currentUser) {
      router.push('/modules')
    }
  }, [currentUser, isLoading, router])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Already logged in - show loading while redirecting
  if (currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Not logged in - show login or register
  if (view === 'register') {
    return <Register setView={setView} />
  }

  return <Login />
}