'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { minLength, object, pipe, string, trim } from 'valibot'
import type { InferInput } from 'valibot'

// Type Imports
import type { SystemMode } from '@core/types'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import AuthShell from './AuthShell'

// Hook Imports
import { useAuth } from '@/hooks/useAuth'

// Lib Imports
import { errorMessage } from '@/libs/api'

// Config Imports
import themeConfig from '@configs/themeConfig'

const schema = object({
  identifier: pipe(string(), trim(), minLength(1, 'Enter your employee ID, mobile or email')),
  password: pipe(string(), minLength(1, 'Enter your password'))
})

type FormData = InferInput<typeof schema>

const REASONS: Record<string, string> = {
  idle: 'You were logged out after a period of inactivity.',
  expired: 'Your session expired. Please log in again.',
  revoked: 'Your session was ended. Please log in again.',
  disabled: 'Your access has been disabled. Please contact your manager.',
  reset: 'Password updated. Log in with your new password.'
}

const Login = ({ mode }: { mode: SystemMode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hooks
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({ resolver: valibotResolver(schema), defaultValues: { identifier: '', password: '' } })

  const reason = searchParams.get('reason')

  const onSubmit = async (data: FormData) => {
    setError(null)

    try {
      const result = await login(data.identifier, data.password)
      const redirect = searchParams.get('redirect')

      router.replace(
        result.must_change_password
          ? '/change-password'
          : redirect && redirect.startsWith('/')
            ? redirect
            : themeConfig.homePageUrl
      )
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <AuthShell mode={mode} title='Welcome back 👋🏻' subtitle='Log in to continue your training'>
      {reason && REASONS[reason] && !error && (
        <Alert severity={reason === 'reset' ? 'success' : 'info'}>{REASONS[reason]}</Alert>
      )}
      {error && <Alert severity='error'>{error}</Alert>}
      <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
        <Controller
          name='identifier'
          control={control}
          render={({ field }) => (
            <CustomTextField
              {...field}
              autoFocus
              fullWidth
              label='Employee ID, mobile or email'
              placeholder='e.g. TM001'
              error={Boolean(errors.identifier)}
              helperText={errors.identifier?.message}
            />
          )}
        />
        <Controller
          name='password'
          control={control}
          render={({ field }) => (
            <CustomTextField
              {...field}
              fullWidth
              label='Password'
              placeholder='············'
              type={isPasswordShown ? 'text' : 'password'}
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        edge='end'
                        onClick={() => setIsPasswordShown(show => !show)}
                        onMouseDown={e => e.preventDefault()}
                      >
                        <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
          )}
        />
        <div className='flex justify-end'>
          <Typography color='primary.main' component={Link} href='/forgot-password'>
            Forgot password?
          </Typography>
        </div>
        <Button fullWidth variant='contained' type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Login'}
        </Button>
      </form>
    </AuthShell>
  )
}

export default Login
