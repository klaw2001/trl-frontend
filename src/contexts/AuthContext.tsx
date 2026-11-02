'use client'

// React Imports
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

// Lib Imports
import { api, tokenStore } from '@/libs/api'

// Type Imports
import type { Profile } from '@/types/apiTypes'

type AccessLevel = 'read' | 'write'

export type AuthContextValue = {
  profile: Profile | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<{ must_change_password: boolean }>
  logout: (reason?: string) => Promise<void>
  refreshProfile: () => Promise<void>
  can: (moduleKey: string | string[], level?: AccessLevel) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const IDLE_MINUTES = Number(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES || 30)

// Re-checks the session so revoked access and shift changes are picked up without a reload
const PROFILE_REFRESH_MS = 2 * 60 * 1000

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // States
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Refs
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refreshProfile = useCallback(async () => {
    if (!tokenStore.access) {
      setProfile(null)

      return
    }

    try {
      const res = await api.get<Profile>('/master/user-profile')

      setProfile(res.data)
    } catch {
      setProfile(null)
    }
  }, [])

  const logout = useCallback(async (reason?: string) => {
    try {
      if (tokenStore.access) {
        await api.post('/auth/logout')
      }
    } catch {
      // Session may already be gone
    }

    tokenStore.clear()
    setProfile(null)
    window.location.href = reason ? `/login?reason=${reason}` : '/login'
  }, [])

  const login = useCallback(
    async (identifier: string, password: string) => {
      const res = await api.post<{ access_token: string; refresh_token: string; must_change_password: boolean }>(
        '/auth/login',
        { identifier, password }
      )

      tokenStore.set(res.data.access_token, res.data.refresh_token)
      await refreshProfile()

      return { must_change_password: res.data.must_change_password }
    },
    [refreshProfile]
  )

  const can = useCallback(
    (moduleKey: string | string[], level: AccessLevel = 'read') => {
      const keys = Array.isArray(moduleKey) ? moduleKey : [moduleKey]

      return Boolean(profile?.access_map.some(item => keys.includes(item.module_key) && item[level]))
    },
    [profile]
  )

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false))
  }, [refreshProfile])

  useEffect(() => {
    if (!profile) {
      return
    }

    const interval = setInterval(refreshProfile, PROFILE_REFRESH_MS)

    return () => clearInterval(interval)
  }, [profile, refreshProfile])

  // Automatic session expiry after inactivity
  useEffect(() => {
    if (!profile) {
      return
    }

    const reset = () => {
      if (idleTimer.current) {
        clearTimeout(idleTimer.current)
      }

      idleTimer.current = setTimeout(() => logout('idle'), IDLE_MINUTES * 60 * 1000)
    }

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click']

    events.forEach(event => window.addEventListener(event, reset, { passive: true }))
    reset()

    return () => {
      events.forEach(event => window.removeEventListener(event, reset))

      if (idleTimer.current) {
        clearTimeout(idleTimer.current)
      }
    }
  }, [profile, logout])

  const value = useMemo(
    () => ({ profile, loading, login, logout, refreshProfile, can }),
    [profile, loading, login, logout, refreshProfile, can]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
