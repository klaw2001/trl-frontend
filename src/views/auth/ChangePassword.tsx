'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'

// Type Imports
import type { SystemMode } from '@core/types'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import AuthShell from './AuthShell'

// Hook Imports
import { useAuth } from '@/hooks/useAuth'

// Lib Imports
import { api, errorMessage, tokenStore } from '@/libs/api'

// Config Imports
import themeConfig from '@configs/themeConfig'

// First login with a temporary password
const ChangePassword = ({ mode }: { mode: SystemMode }) => {
  // States
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Hooks
  const router = useRouter()
  const { profile, loading, refreshProfile, logout } = useAuth()

  useEffect(() => {
    if (!loading && !profile) {
      router.replace('/login')
    }
  }, [loading, profile, router])

  const onSubmit = async () => {
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match')

      return
    }

    setBusy(true)

    try {
      const res = await api.post<{ access_token: string; refresh_token: string }>('/auth/change-password', {
        current_password: current,
        new_password: password
      })

      tokenStore.set(res.data.access_token, res.data.refresh_token)
      await refreshProfile()
      router.replace(themeConfig.homePageUrl)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell mode={mode} title='Set your password 🔐' subtitle='Replace the temporary password before you continue'>
      {error && <Alert severity='error'>{error}</Alert>}
      <form
        className='flex flex-col gap-5'
        onSubmit={e => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <CustomTextField
          autoFocus
          fullWidth
          type='password'
          label='Current (temporary) password'
          value={current}
          onChange={e => setCurrent(e.target.value)}
        />
        <CustomTextField
          fullWidth
          type='password'
          label='New password'
          helperText='At least 8 characters with a letter and a number'
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <CustomTextField
          fullWidth
          type='password'
          label='Confirm new password'
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
        />
        <Button fullWidth variant='contained' type='submit' disabled={busy || !current || !password}>
          Save password
        </Button>
        <Button variant='text' color='secondary' onClick={() => logout()}>
          Log out
        </Button>
      </form>
    </AuthShell>
  )
}

export default ChangePassword
