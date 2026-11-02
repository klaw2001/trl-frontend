'use client'

// React Imports
import { useEffect } from 'react'
import type { ReactNode } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Hook Imports
import { useAuth } from '@/hooks/useAuth'

// Config Imports
import themeConfig from '@configs/themeConfig'

const GuestOnlyRoute = ({ children }: { children: ReactNode }) => {
  // Hooks
  const { profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && profile && !profile.user.user_must_change_password) {
      router.replace(themeConfig.homePageUrl)
    }
  }, [loading, profile, router])

  return <>{children}</>
}

export default GuestOnlyRoute
