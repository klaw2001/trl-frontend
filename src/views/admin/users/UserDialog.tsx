'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import FormDialog from '@/components/dialogs/FormDialog'
import SelectField from '@/components/form/SelectField'
import ShiftFields from '@/components/form/ShiftFields'
import CustomTextField from '@core/components/mui/TextField'

// Hook Imports
import { useOptions } from '@/hooks/useOptions'

// Lib Imports
import { api } from '@/libs/api'

export type UserForm = {
  user_id?: number
  user_employee_id: string
  user_first_name: string
  user_last_name: string
  user_mobile: string
  user_email: string
  user_role_id: number | null
  user_outlet_id: number | null
  user_designation: string
  user_manager_id: number | null
  user_joining_date: string
  user_language: string
  user_path_id: number | null
  user_path_deadline: string
  user_shift_start: string | null
  user_shift_end: string | null
  user_shift_days: number[]
  user_shift_exempt: boolean
  user_access_expires_at: string
  user_password: string
}

export const emptyUser: UserForm = {
  user_employee_id: '',
  user_first_name: '',
  user_last_name: '',
  user_mobile: '',
  user_email: '',
  user_role_id: null,
  user_outlet_id: null,
  user_designation: '',
  user_manager_id: null,
  user_joining_date: new Date().toISOString().slice(0, 10),
  user_language: 'en',
  user_path_id: null,
  user_path_deadline: '',
  user_shift_start: null,
  user_shift_end: null,
  user_shift_days: [],
  user_shift_exempt: false,
  user_access_expires_at: '',
  user_password: ''
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'mr', label: 'Marathi' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'kn', label: 'Kannada' },
  { value: 'bn', label: 'Bengali' }
]

// API dates -> input values
export const toUserForm = (user: any): UserForm => ({
  ...emptyUser,
  ...Object.fromEntries(Object.keys(emptyUser).map(key => [key, user[key] ?? (emptyUser as any)[key]])),
  user_id: user.user_id,
  user_mobile: (user.user_mobile || '').replace(/^91(?=\d{10}$)/, ''),
  user_joining_date: user.user_joining_date ? String(user.user_joining_date).slice(0, 10) : '',
  user_path_deadline: user.user_path_deadline ? String(user.user_path_deadline).slice(0, 10) : '',
  user_access_expires_at: user.user_access_expires_at ? String(user.user_access_expires_at).slice(0, 10) : '',
  user_password: ''
})

type Props = {
  user: UserForm | null
  onClose: () => void
  onSaved: (result: { user_id: number; temp_password: string | null; assigned_modules: number; name: string }) => void
}

const UserDialog = ({ user, onClose, onSaved }: Props) => {
  // States
  const [form, setForm] = useState<UserForm>(emptyUser)

  // Hooks
  const { options: roles } = useOptions('roles')
  const { options: outlets } = useOptions('outlets')
  const { options: paths } = useOptions('paths')

  const { options: managers } = useOptions(
    'users',
    form.user_outlet_id ? { outlet_id: form.user_outlet_id } : undefined
  )

  useEffect(() => {
    if (user) {
      setForm(user)
    }
  }, [user])

  const set = <K extends keyof UserForm>(key: K, value: UserForm[K]) => setForm(prev => ({ ...prev, [key]: value }))

  const save = async () => {
    const { user_password, ...rest } = form

    const res = await api.post<{ user_id: number; temp_password: string | null; assigned_modules: number }>(
      '/user/save',
      {
        ...rest,
        ...(user_password ? { user_password } : {}),
        user_email: rest.user_email || null,
        user_joining_date: rest.user_joining_date || null,
        user_path_deadline: rest.user_path_deadline || null,
        user_access_expires_at: rest.user_access_expires_at ? `${rest.user_access_expires_at}T23:59:59` : null
      }
    )

    toast.success(form.user_id ? 'User updated' : 'User created')
    onSaved({ ...res.data, name: `${form.user_first_name} ${form.user_last_name}` })
  }

  return (
    <FormDialog
      open={Boolean(user)}
      maxWidth='md'
      title={form.user_id ? 'Edit user' : 'Add user'}
      onClose={onClose}
      onSubmit={save}
    >
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <CustomTextField
          fullWidth
          required
          label='Employee ID'
          value={form.user_employee_id}
          onChange={e => set('user_employee_id', e.target.value)}
        />
        <CustomTextField
          fullWidth
          required
          label='Mobile'
          value={form.user_mobile}
          onChange={e => set('user_mobile', e.target.value)}
          placeholder='10 digit mobile'
        />
        <CustomTextField
          fullWidth
          required
          label='First name'
          value={form.user_first_name}
          onChange={e => set('user_first_name', e.target.value)}
        />
        <CustomTextField
          fullWidth
          required
          label='Last name'
          value={form.user_last_name}
          onChange={e => set('user_last_name', e.target.value)}
        />
        <CustomTextField
          fullWidth
          label='Email'
          value={form.user_email}
          onChange={e => set('user_email', e.target.value)}
        />
        <SelectField
          label='Preferred language'
          options={LANGUAGES}
          value={form.user_language}
          onChange={value => set('user_language', value)}
        />
        <SelectField
          required
          label='Role'
          options={roles}
          value={form.user_role_id}
          onChange={value => set('user_role_id', value)}
        />
        <SelectField
          label='Outlet'
          options={outlets}
          emptyLabel='No outlet (head office)'
          value={form.user_outlet_id}
          onChange={value => set('user_outlet_id', value)}
        />
        <CustomTextField
          fullWidth
          label='Designation'
          value={form.user_designation}
          onChange={e => set('user_designation', e.target.value)}
        />
        <SelectField
          label='Reporting manager'
          options={managers.filter(m => m.value !== form.user_id)}
          emptyLabel='None'
          value={form.user_manager_id}
          onChange={value => set('user_manager_id', value)}
        />
        <CustomTextField
          fullWidth
          type='date'
          label='Joining date'
          value={form.user_joining_date}
          onChange={e => set('user_joining_date', e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <CustomTextField
          fullWidth
          type='date'
          label='Access ends on'
          helperText='Optional, for temporary staff'
          value={form.user_access_expires_at}
          onChange={e => set('user_access_expires_at', e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </div>

      <Divider />
      <Typography className='font-medium'>Training path</Typography>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <SelectField
          label='Required training path'
          options={paths}
          emptyLabel='None'
          value={form.user_path_id}
          onChange={value => set('user_path_id', value)}
          helperText='Modules of the path are assigned when the path is set'
        />
        <CustomTextField
          fullWidth
          type='date'
          label='Path completion deadline'
          value={form.user_path_deadline}
          onChange={e => set('user_path_deadline', e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          helperText='Empty = each module’s default deadline'
        />
      </div>

      <Divider />
      <Typography className='font-medium'>Shift access</Typography>
      <FormControlLabel
        control={<Switch checked={form.user_shift_exempt} onChange={e => set('user_shift_exempt', e.target.checked)} />}
        label='Exempt from shift restriction'
      />
      {!form.user_shift_exempt && (
        <ShiftFields
          start={form.user_shift_start}
          end={form.user_shift_end}
          days={form.user_shift_days}
          onChange={shift =>
            setForm(prev => ({
              ...prev,
              user_shift_start: shift.start,
              user_shift_end: shift.end,
              user_shift_days: shift.days
            }))
          }
          helperText='Leave empty to use the outlet shift. No days selected means every day.'
        />
      )}

      {!form.user_id && (
        <>
          <Divider />
          <CustomTextField
            fullWidth
            type='password'
            label='Initial password'
            helperText='Optional. Leave empty to generate a temporary password; the user must change it on first login.'
            value={form.user_password}
            onChange={e => set('user_password', e.target.value)}
          />
        </>
      )}
    </FormDialog>
  )
}

export default UserDialog
