'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import PageHeader from '@/components/PageHeader'
import ServerTable from '@/components/ServerTable'
import FormDialog from '@/components/dialogs/FormDialog'
import SelectField from '@/components/form/SelectField'
import CustomTextField from '@core/components/mui/TextField'

// Hook Imports
import { useServerTable } from '@/hooks/useServerTable'
import { useAuth } from '@/hooks/useAuth'

// Lib Imports
import { api } from '@/libs/api'

// Type Imports
import type { RoleScope } from '@/types/apiTypes'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

type Role = {
  role_id: number
  role_key: string
  role_name: string
  role_description: string | null
  role_scope: RoleScope
  role_shift_restricted: boolean
  role_is_system: boolean
  role_status: boolean
  _count: { users: number }
}

type Permission = { module_id: number; module_name: string; module_key: string; read: boolean; write: boolean }

type RoleForm = Omit<Role, 'role_id' | '_count' | 'role_is_system' | 'role_description'> & {
  role_id?: number
  role_is_system?: boolean
  role_description: string
  module_role_map: Permission[]
}

export const SCOPE_OPTIONS: { value: RoleScope; label: string }[] = [
  { value: 'all', label: 'All brands and outlets' },
  { value: 'brand', label: 'Own brand' },
  { value: 'franchise', label: 'Own franchise outlets' },
  { value: 'outlet', label: 'Own outlet' },
  { value: 'self', label: 'Own records only' }
]

const RoleList = () => {
  // States
  const [form, setForm] = useState<RoleForm | null>(null)

  // Hooks
  const { can } = useAuth()
  const { rows, reload, tableProps } = useServerTable<Role>('/role/all', {}, 50)

  const open = async (role?: Role) => {
    if (role) {
      const res = await api.get<Role & { module_role_map: Permission[] }>(`/role/single/${role.role_id}`)

      setForm({ ...res.data, role_description: res.data.role_description || '' })

      return
    }

    const modules = await api.get<{ module_id: number; module_name: string; module_key: string }[]>('/master/modules')

    setForm({
      role_key: '',
      role_name: '',
      role_description: '',
      role_scope: 'self',
      role_shift_restricted: true,
      role_status: true,
      module_role_map: modules.data.map(item => ({ ...item, read: false, write: false }))
    })
  }

  const setPermission = (module_id: number, key: 'read' | 'write', value: boolean) =>
    form &&
    setForm({
      ...form,
      module_role_map: form.module_role_map.map(item =>
        item.module_id === module_id
          ? {
              ...item,
              [key]: value,
              ...(key === 'write' && value ? { read: true } : {}),
              ...(key === 'read' && !value ? { write: false } : {})
            }
          : item
      )
    })

  const save = async () => {
    await api.post('/role/save', form)
    toast.success('Role saved')
    setForm(null)
    reload()
  }

  return (
    <>
      <PageHeader
        title='Roles & Permissions'
        subtitle='What each role can see and change, and whether it is limited to shift hours'
        actions={
          can('role', 'write') && (
            <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => open()}>
              Add role
            </Button>
          )
        }
      />
      <Card>
        <ServerTable
          {...tableProps}
          rows={rows}
          rowKey={row => row.role_id}
          columns={[
            {
              key: 'role_name',
              header: 'Role',
              render: row => (
                <div className='flex flex-col'>
                  <Typography color='text.primary' className='font-medium'>
                    {row.role_name}
                  </Typography>
                  <Typography variant='body2'>{row.role_description}</Typography>
                </div>
              )
            },
            { key: 'scope', header: 'Sees', render: row => SCOPE_OPTIONS.find(s => s.value === row.role_scope)?.label },
            {
              key: 'shift',
              header: 'Shift hours only',
              render: row => (
                <Chip
                  size='small'
                  variant='tonal'
                  label={row.role_shift_restricted ? 'Yes' : 'No'}
                  color={row.role_shift_restricted ? 'warning' : 'secondary'}
                />
              )
            },
            { key: 'users', header: 'Users', render: row => row._count.users },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: row =>
                can('role', 'write') && (
                  <IconButton onClick={() => open(row)}>
                    <i className='tabler-edit' />
                  </IconButton>
                )
            }
          ]}
        />
      </Card>
      {form && (
        <FormDialog
          open
          maxWidth='md'
          title={form.role_id ? `Edit ${form.role_name}` : 'Add role'}
          onClose={() => setForm(null)}
          onSubmit={save}
        >
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <CustomTextField
              fullWidth
              label='Role name'
              value={form.role_name}
              onChange={e => setForm({ ...form, role_name: e.target.value })}
            />
            <CustomTextField
              fullWidth
              label='Key'
              disabled={form.role_is_system}
              value={form.role_key}
              onChange={e => setForm({ ...form, role_key: e.target.value })}
            />
          </div>
          <CustomTextField
            fullWidth
            label='Description'
            value={form.role_description}
            onChange={e => setForm({ ...form, role_description: e.target.value })}
          />
          <SelectField
            label='Data visibility'
            options={SCOPE_OPTIONS}
            value={form.role_scope}
            onChange={value => setForm({ ...form, role_scope: value })}
            helperText='Limits users, reports and teams this role can see'
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.role_shift_restricted}
                onChange={e => setForm({ ...form, role_shift_restricted: e.target.checked })}
              />
            }
            label='Training and recipes only during shift hours'
          />
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Permission</th>
                <th className='text-center'>View</th>
                <th className='text-center'>Manage</th>
              </tr>
            </thead>
            <tbody>
              {form.module_role_map.map(item => (
                <tr key={item.module_id}>
                  <td>{item.module_name}</td>
                  <td className='text-center'>
                    <Checkbox
                      checked={item.read}
                      onChange={e => setPermission(item.module_id, 'read', e.target.checked)}
                    />
                  </td>
                  <td className='text-center'>
                    <Checkbox
                      checked={item.write}
                      onChange={e => setPermission(item.module_id, 'write', e.target.checked)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Typography variant='body2' color='text.secondary'>
            Every role can complete its own training and open recipes; these permissions control management screens.
          </Typography>
        </FormDialog>
      )}
    </>
  )
}

export default RoleList
