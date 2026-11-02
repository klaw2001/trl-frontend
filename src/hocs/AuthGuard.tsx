'use client'

// React Imports
import { useEffect } from 'react'
import type { ReactNode } from 'react'

// Next Imports
import { usePathname, useRouter } from 'next/navigation'

// MUI Imports
import CircularProgress from '@mui/material/CircularProgress'

// Hook Imports
import { useAuth } from '@/hooks/useAuth'

const AuthGuard = ({ children }: { children: ReactNode }) => {
  // Hooks
  const { profile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) {
      return
    }

    if (!profile) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
    } else if (profile.user.user_must_change_password) {
      router.replace('/change-password')
    }
  }, [loading, profile, router, pathname])

  if (loading || !profile || profile.user.user_must_change_password) {
    return (
      <div className='flex items-center justify-center min-bs-[100dvh]'>
        <CircularProgress />
      </div>
    )
  }

  return <>{children}</>
}

export default AuthGuard
