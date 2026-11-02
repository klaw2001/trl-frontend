'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import PageHeader from '@/components/PageHeader'
import ServerTable from '@/components/ServerTable'
import DebouncedInput from '@/components/DebouncedInput'
import FormDialog from '@/components/dialogs/FormDialog'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog'
import SelectField from '@/components/form/SelectField'
import OptionMenu from '@core/components/option-menu'
import CustomTextField from '@core/components/mui/TextField'
import UserDialog, { emptyUser, toUserForm } from './UserDialog'
import type { UserForm } from './UserDialog'

// Hook Imports
import { useServerTable } from '@/hooks/useServerTable'
import { useOptions } from '@/hooks/useOptions'
import { useAuth } from '@/hooks/useAuth'

// Lib Imports
import { api, errorMessage } from '@/libs/api'

// Util Imports
import { formatDateTime, fullName } from '@/utils/format'

type UserRow = {
  user_id: number
  user_employee_id: string
  user_first_name: string
  user_last_name: string
  user_mobile: string
  user_status: boolean
  user_locked_until: string | null
  user_last_login_at: string | null
  user_deactivation_reason: string | null
  user_role_relation: { role_name: string }
  user_outlet: { outlet_id: number; outlet_name: string } | null
  user_brand: { brand_name: string } | null
  [key: string]: any
}

type Action = { type: 'deactivate' | 'transfer' | 'reset' | 'logout' | 'reactivate'; user: UserRow } | null

const STATUS_OPTIONS = [
  { value: '1', label: 'Active' },
  { value: '0', label: 'Deactivated' }
]

const UserList = () => {
  // States
  const [editing, setEditing] = useState<UserForm | null>(null)
  const [action, setAction] = useState<Action>(null)
  const [reason, setReason] = useState('')
  const [outletId, setOutletId] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [secret, setSecret] = useState<{ name: string; password: string; assigned?: number } | null>(null)

  // Hooks
  const router = useRouter()
  const { can, profile } = useAuth()
  const { options: roles } = useOptions('roles')
  const { options: outlets } = useOptions('outlets')

  const { rows, filters, setFilter, reload, tableProps } = useServerTable<UserRow>('/user/all', {
    search: '',
    role_id: '',
    outlet_id: '',
    status: '1'
  })

  const canWrite = can('user', 'write')

  const closeAction = () => {
    setAction(null)
    setReason('')
    setOutletId(null)
    setNote('')
  }

  const run = async (path: string, body: object, message: string) => {
    try {
      const res = await api.post(path, body)

      toast.success(message)
      closeAction()
      reload()

      return res.data
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const openEdit = async (user: UserRow) => {
    const res = await api.get(`/user/single/${user.user_id}`)

    setEditing(toUserForm(res.data))
  }

  return (
    <>
      <PageHeader
        title='Users'
        subtitle='Employees, in-charges and franchisees with their outlet, role and shift'
        actions={
          canWrite && (
            <Button
              variant='contained'
              startIcon={<i className='tabler-user-plus' />}
              onClick={() => setEditing(emptyUser)}
            >
              Add user
            </Button>
          )
        }
      />
      <Card>
        <CardContent className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <DebouncedInput
            value={filters.search}
            onChange={value => setFilter('search', value)}
            placeholder='Name, employee ID, mobile'
          />
          <SelectField
            label=''
            options={roles}
            emptyLabel='All roles'
            value={filters.role_id}
            onChange={value => setFilter('role_id', value || '')}
          />
          <SelectField
            label=''
            options={outlets}
            emptyLabel='All outlets'
            value={filters.outlet_id}
            onChange={value => setFilter('outlet_id', value || '')}
          />
          <SelectField
            label=''
            options={STATUS_OPTIONS}
            emptyLabel='Any status'
            value={filters.status}
            onChange={value => setFilter('status', value || '')}
          />
        </CardContent>
        <ServerTable
          {...tableProps}
          rows={rows}
          rowKey={row => row.user_id}
          columns={[
            {
              key: 'name',
              header: 'Employee',
              render: row => (
                <div className='flex flex-col'>
                  <Typography color='text.primary' className='font-medium'>
                    {fullName(row)}
                  </Typography>
                  <Typography variant='body2'>{row.user_employee_id}</Typography>
                </div>
              )
            },
            { key: 'role', header: 'Role', render: row => row.user_role_relation.role_name },
            {
              key: 'outlet',
              header: 'Outlet',
              render: row => (
                <div className='flex flex-col'>
                  <Typography>{row.user_outlet?.outlet_name || '—'}</Typography>
                  <Typography variant='body2'>{row.user_brand?.brand_name}</Typography>
                </div>
              )
            },
            { key: 'user_mobile', header: 'Mobile' },
            { key: 'login', header: 'Last login', render: row => formatDateTime(row.user_last_login_at) },
            {
              key: 'status',
              header: 'Access',
              render: row =>
                !row.user_status ? (
                  <Chip
                    size='small'
                    variant='tonal'
                    color='error'
                    label='Removed'
                    title={row.user_deactivation_reason || ''}
                  />
                ) : row.user_locked_until && new Date(row.user_locked_until) > new Date() ? (
                  <Chip size='small' variant='tonal' color='warning' label='Locked' />
                ) : (
                  <Chip size='small' variant='tonal' color='success' label='Active' />
                )
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: row => (
                <OptionMenu
                  iconButtonProps={{ size: 'small' }}
                  options={[
                    {
                      text: 'Training history',
                      icon: <i className='tabler-history' />,
                      menuItemProps: { onClick: () => router.push(`/team/${row.user_id}`) }
                    },
                    ...(canWrite
                      ? [
                          {
                            text: 'Edit',
                            icon: <i className='tabler-edit' />,
                            menuItemProps: { onClick: () => openEdit(row) }
                          },
                          {
                            text: 'Transfer outlet',
                            icon: <i className='tabler-transfer' />,
                            menuItemProps: { onClick: () => setAction({ type: 'transfer', user: row }) }
                          },
                          {
                            text: 'Reset password',
                            icon: <i className='tabler-key' />,
                            menuItemProps: { onClick: () => setAction({ type: 'reset', user: row }) }
                          },
                          {
                            text: 'End all sessions',
                            icon: <i className='tabler-logout' />,
                            menuItemProps: { onClick: () => setAction({ type: 'logout', user: row }) }
                          },
                          row.user_status
                            ? {
                                text: 'Remove access',
                                icon: <i className='tabler-user-off' />,
                                menuItemProps: {
                                  className: 'text-error',
                                  disabled: row.user_id === profile?.user.user_id,
                                  onClick: () => setAction({ type: 'deactivate', user: row })
                                }
                              }
                            : {
                                text: 'Restore access',
                                icon: <i className='tabler-user-check' />,
                                menuItemProps: { onClick: () => setAction({ type: 'reactivate', user: row }) }
                              }
                        ]
                      : [])
                  ]}
                />
              )
            }
          ]}
        />
      </Card>

      <UserDialog
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={result => {
          setEditing(null)
          reload()

          if (result.temp_password) {
            setSecret({ name: result.name, password: result.temp_password, assigned: result.assigned_modules })
          } else if (result.assigned_modules) {
            toast.info(`${result.assigned_modules} training modules assigned from the path`)
          }
        }}
      />

      <ConfirmDialog
        open={action?.type === 'deactivate'}
        title='Remove access'
        confirmText='Remove access'
        confirmColor='error'
        description={`${fullName(action?.user)} is logged out immediately and cannot log in again until access is restored. Training records are kept.`}
        onClose={closeAction}
        onConfirm={() => run('/user/deactivate', { user_id: action?.user.user_id, reason }, 'Access removed')}
      >
        <CustomTextField
          fullWidth
          label='Reason'
          placeholder='e.g. Left the company'
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={action?.type === 'reactivate'}
        title='Restore access'
        confirmText='Restore'
        description={`${fullName(action?.user)} will be able to log in again.`}
        onClose={closeAction}
        onConfirm={() => run('/user/reactivate', { user_id: action?.user.user_id }, 'Access restored')}
      />

      <ConfirmDialog
        open={action?.type === 'logout'}
        title='End all sessions'
        confirmText='End sessions'
        description={`${fullName(action?.user)} is logged out on every device.`}
        onClose={closeAction}
        onConfirm={() => run('/user/force-logout', { user_id: action?.user.user_id }, 'Sessions ended')}
      />

      <ConfirmDialog
        open={action?.type === 'reset'}
        title='Reset password'
        confirmText='Reset'
        description={`A temporary password is generated for ${fullName(action?.user)}. Their sessions end and they must set a new password at the next login.`}
        onClose={closeAction}
        onConfirm={async () => {
          const user = action?.user
          const data = await run('/user/reset-password', { user_id: user?.user_id }, 'Password reset')

          if (data?.temp_password && user) {
            setSecret({ name: fullName(user), password: data.temp_password })
          }
        }}
      />

      <FormDialog
        open={action?.type === 'transfer'}
        title={`Transfer ${fullName(action?.user)}`}
        submitText='Transfer'
        onClose={closeAction}
        onSubmit={() =>
          run('/user/transfer', { user_id: action?.user.user_id, outlet_id: outletId, note }, 'User transferred')
        }
        disabled={!outletId}
      >
        <Typography color='text.secondary'>
          Current outlet: {action?.user.user_outlet?.outlet_name || 'None'}
        </Typography>
        <SelectField
          label='New outlet'
          options={outlets.filter(o => o.value !== action?.user.user_outlet?.outlet_id)}
          value={outletId}
          onChange={setOutletId}
        />
        <CustomTextField fullWidth label='Note' value={note} onChange={e => setNote(e.target.value)} />
      </FormDialog>

      <FormDialog open={Boolean(secret)} title='Temporary password' onClose={() => setSecret(null)}>
        <Alert severity='warning'>Share this password with {secret?.name} privately. It is shown only once.</Alert>
        <Typography variant='h4' className='text-center font-mono select-all'>
          {secret?.password}
        </Typography>
        {secret?.assigned ? (
          <Typography color='text.secondary'>
            {secret.assigned} training modules were assigned from the selected path.
          </Typography>
        ) : null}
      </FormDialog>
    </>
  )
}

export default UserList
