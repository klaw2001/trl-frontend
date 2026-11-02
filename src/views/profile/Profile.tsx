'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import PageHeader from '@/components/PageHeader'
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'

// Hook Imports
import { useAuth } from '@/hooks/useAuth'

// Lib Imports
import { api, errorMessage, tokenStore } from '@/libs/api'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { WEEKDAYS, fullName } from '@/utils/format'

const Profile = () => {
  // Hooks
  const { profile, refreshProfile } = useAuth()

  // States
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  if (!profile) {
    return null
  }

  const { user, shift } = profile

  const changePassword = async () => {
    if (password !== confirm) {
      toast.error('Passwords do not match')

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
      setCurrent('')
      setPassword('')
      setConfirm('')
      toast.success('Password changed. Other devices were logged out.')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const details = [
    { label: 'Employee ID', value: user.user_employee_id },
    { label: 'Role', value: user.user_role_relation.role_name },
    { label: 'Designation', value: user.user_designation },
    { label: 'Brand', value: user.user_brand?.brand_name },
    { label: 'Outlet', value: user.user_outlet?.outlet_name },
    { label: 'Reporting manager', value: fullName(user.user_manager) },
    { label: 'Mobile', value: user.user_mobile },
    { label: 'Email', value: user.user_email },
    {
      label: 'Shift',
      value: shift.start
        ? `${shift.start} – ${shift.end} (${shift.days.length ? shift.days.map(d => WEEKDAYS[d - 1].label).join(', ') : 'every day'})`
        : shift.restricted
          ? 'Not set'
          : 'Not restricted'
    }
  ]

  return (
    <>
      <PageHeader title='My Profile' />
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent className='flex items-center gap-4'>
              <CustomAvatar skin='light' color='primary' size={64}>
                {getInitials(fullName(user))}
              </CustomAvatar>
              <div>
                <Typography variant='h5'>{fullName(user)}</Typography>
                <Typography color='text.secondary'>{user.user_role_relation.role_name}</Typography>
              </div>
            </CardContent>
            <CardContent className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {details.map(item => (
                <div key={item.label}>
                  <Typography variant='body2' color='text.secondary'>
                    {item.label}
                  </Typography>
                  <Typography>{item.value || '—'}</Typography>
                </div>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardHeader title='Change password' subheader='Changing it logs you out on other devices' />
            <CardContent>
              <form
                className='flex flex-col gap-4'
                onSubmit={e => {
                  e.preventDefault()
                  changePassword()
                }}
              >
                <CustomTextField
                  fullWidth
                  type='password'
                  label='Current password'
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
                <Button variant='contained' type='submit' disabled={busy || !current || !password}>
                  Update password
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}

export default Profile
