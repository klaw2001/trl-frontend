'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'
import { OTPInput } from 'input-otp'
import type { SlotProps } from 'input-otp'

// Type Imports
import type { SystemMode } from '@core/types'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import AuthShell from './AuthShell'

// Lib Imports
import { api, errorMessage } from '@/libs/api'

// Style Imports
import styles from '@/libs/styles/inputOtp.module.css'

const Slot = (props: SlotProps) => (
  <div className={classnames(styles.slot, { [styles.slotActive]: props.isActive })}>
    {props.char !== null && <div>{props.char}</div>}
    {props.hasFakeCaret && (
      <div className={styles.fakeCaret}>
        <div className='w-px h-5 bg-textPrimary' />
      </div>
    )}
  </div>
)

type Step = 'request' | 'verify' | 'reset'

const ForgotPassword = ({ mode }: { mode: SystemMode }) => {
  // States
  const [step, setStep] = useState<Step>('request')
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Hooks
  const router = useRouter()

  const run = async (action: () => Promise<void>) => {
    setError(null)
    setBusy(true)

    try {
      await action()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const requestOtp = () =>
    run(async () => {
      const res = await api.post<{ sent_to?: string } | null>('/auth/forgot-password', { identifier })

      setSentTo(res.data?.sent_to || null)
      setStep('verify')
    })

  const verifyOtp = () =>
    run(async () => {
      const res = await api.post<{ reset_token: string }>('/auth/verify-otp', { identifier, otp })

      setResetToken(res.data.reset_token)
      setStep('reset')
    })

  const resetPassword = () =>
    run(async () => {
      if (password !== confirm) {
        throw new Error('Passwords do not match')
      }

      await api.post('/auth/reset-password', { reset_token: resetToken, password })
      router.replace('/login?reason=reset')
    })

  return (
    <AuthShell
      mode={mode}
      title='Reset password 🔒'
      subtitle={
        step === 'request'
          ? 'We will send a one-time code to your registered mobile and email'
          : step === 'verify'
            ? `Enter the 6 digit code${sentTo ? ` sent to ${sentTo}` : ''}`
            : 'Choose a new password'
      }
    >
      {error && <Alert severity='error'>{error}</Alert>}
      {step === 'request' && (
        <form
          className='flex flex-col gap-5'
          onSubmit={e => {
            e.preventDefault()
            requestOtp()
          }}
        >
          <CustomTextField
            autoFocus
            fullWidth
            label='Employee ID, mobile or email'
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
          />
          <Button fullWidth variant='contained' type='submit' disabled={busy || !identifier.trim()}>
            Send OTP
          </Button>
        </form>
      )}
      {step === 'verify' && (
        <form
          className='flex flex-col gap-5'
          onSubmit={e => {
            e.preventDefault()
            verifyOtp()
          }}
        >
          <OTPInput
            onChange={setOtp}
            value={otp}
            maxLength={6}
            containerClassName='group flex items-center'
            render={({ slots }) => (
              <div className='flex items-center justify-between w-full gap-3'>
                {slots.map((slot, idx) => (
                  <Slot key={idx} {...slot} />
                ))}
              </div>
            )}
          />
          <Button fullWidth variant='contained' type='submit' disabled={busy || otp.length !== 6}>
            Verify OTP
          </Button>
          <Button variant='text' onClick={requestOtp} disabled={busy}>
            Resend code
          </Button>
        </form>
      )}
      {step === 'reset' && (
        <form
          className='flex flex-col gap-5'
          onSubmit={e => {
            e.preventDefault()
            resetPassword()
          }}
        >
          <CustomTextField
            autoFocus
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
            label='Confirm password'
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
          />
          <Button fullWidth variant='contained' type='submit' disabled={busy || !password}>
            Set new password
          </Button>
        </form>
      )}
      <Typography className='flex justify-center items-center' color='primary.main'>
        <Link href='/login' className='flex items-center gap-1.5'>
          <i className='tabler-chevron-left text-xl' />
          <span>Back to login</span>
        </Link>
      </Typography>
    </AuthShell>
  )
}

export default ForgotPassword
