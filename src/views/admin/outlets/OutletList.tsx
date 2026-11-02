'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import PageHeader from '@/components/PageHeader'
import ServerTable from '@/components/ServerTable'
import DebouncedInput from '@/components/DebouncedInput'
import FormDialog from '@/components/dialogs/FormDialog'
import SelectField from '@/components/form/SelectField'
import ShiftFields from '@/components/form/ShiftFields'
import { BooleanChip } from '@/components/StatusChip'
import CustomTextField from '@core/components/mui/TextField'

// Hook Imports
import { useServerTable } from '@/hooks/useServerTable'
import { useOptions } from '@/hooks/useOptions'
import { useAuth } from '@/hooks/useAuth'

// Lib Imports
import { api } from '@/libs/api'

// Util Imports
import { fullName } from '@/utils/format'

type Outlet = {
  outlet_id: number
  outlet_name: string
  outlet_code: string
  outlet_brand_id: number
  outlet_city: string | null
  outlet_address: string | null
  outlet_franchisee_id: number | null
  outlet_timezone: string
  outlet_shift_start: string | null
  outlet_shift_end: string | null
  outlet_shift_days: number[]
  outlet_status: boolean
  outlet_brand: { brand_name: string }
  outlet_franchisee: { user_first_name: string; user_last_name: string } | null
  _count: { users: number }
}

const empty = {
  outlet_name: '',
  outlet_code: '',
  outlet_brand_id: null as number | null,
  outlet_city: '',
  outlet_address: '',
  outlet_franchisee_id: null as number | null,
  outlet_timezone: 'Asia/Kolkata',
  outlet_shift_start: '09:00' as string | null,
  outlet_shift_end: '23:00' as string | null,
  outlet_shift_days: [] as number[],
  outlet_status: true
}

const OutletList = () => {
  // States
  const [form, setForm] = useState<(typeof empty & { outlet_id?: number }) | null>(null)

  // Hooks
  const { can } = useAuth()
  const { options: brands } = useOptions('brands')
  const { rows: roles } = useOptions('roles')
  const franchiseeRole = roles.find(role => role.role_key === 'franchisee')
  const { options: franchisees } = useOptions('users', franchiseeRole ? { role_id: franchiseeRole.role_id } : undefined)

  const { rows, filters, setFilter, reload, tableProps } = useServerTable<Outlet>('/outlet/all', {
    search: '',
    brand_id: ''
  })

  const save = async () => {
    await api.post('/outlet/save', form)
    toast.success('Outlet saved')
    setForm(null)
    reload()
  }

  return (
    <>
      <PageHeader
        title='Outlets'
        subtitle='Outlet shift hours are the default access window for their staff'
        actions={
          can('outlet', 'write') && (
            <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => setForm(empty)}>
              Add outlet
            </Button>
          )
        }
      />
      <Card>
        <CardContent className='flex flex-wrap gap-4'>
          <DebouncedInput
            value={filters.search}
            onChange={value => setFilter('search', value)}
            placeholder='Search outlets'
            className='min-is-[240px]'
          />
          <SelectField
            className='max-is-[220px]'
            label=''
            options={brands}
            emptyLabel='All brands'
            value={filters.brand_id}
            onChange={value => setFilter('brand_id', value || '')}
          />
        </CardContent>
        <ServerTable
          {...tableProps}
          rows={rows}
          rowKey={row => row.outlet_id}
          columns={[
            {
              key: 'outlet_name',
              header: 'Outlet',
              render: row => (
                <div className='flex flex-col'>
                  <Typography color='text.primary' className='font-medium'>
                    {row.outlet_name}
                  </Typography>
                  <Typography variant='body2'>{row.outlet_code}</Typography>
                </div>
              )
            },
            { key: 'brand', header: 'Brand', render: row => row.outlet_brand.brand_name },
            { key: 'outlet_city', header: 'City' },
            { key: 'franchisee', header: 'Franchisee', render: row => fullName(row.outlet_franchisee) || '—' },
            {
              key: 'shift',
              header: 'Shift',
              render: row =>
                row.outlet_shift_start ? `${row.outlet_shift_start} – ${row.outlet_shift_end}` : 'Not set'
            },
            { key: 'staff', header: 'Staff', render: row => row._count.users },
            { key: 'status', header: 'Status', render: row => <BooleanChip value={row.outlet_status} /> },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: row =>
                can('outlet', 'write') && (
                  <IconButton
                    onClick={() =>
                      setForm({
                        ...empty,
                        ...row,
                        outlet_city: row.outlet_city || '',
                        outlet_address: row.outlet_address || ''
                      })
                    }
                  >
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
          title={form.outlet_id ? 'Edit outlet' : 'Add outlet'}
          onClose={() => setForm(null)}
          onSubmit={save}
        >
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <CustomTextField
              fullWidth
              label='Outlet name'
              value={form.outlet_name}
              onChange={e => setForm({ ...form, outlet_name: e.target.value })}
            />
            <CustomTextField
              fullWidth
              label='Code'
              value={form.outlet_code}
              onChange={e => setForm({ ...form, outlet_code: e.target.value })}
            />
            <SelectField
              label='Brand'
              options={brands}
              value={form.outlet_brand_id}
              onChange={value => setForm({ ...form, outlet_brand_id: value })}
            />
            <SelectField
              label='Franchisee'
              options={franchisees}
              emptyLabel='Company owned'
              value={form.outlet_franchisee_id}
              onChange={value => setForm({ ...form, outlet_franchisee_id: value })}
            />
            <CustomTextField
              fullWidth
              label='City'
              value={form.outlet_city}
              onChange={e => setForm({ ...form, outlet_city: e.target.value })}
            />
            <CustomTextField
              fullWidth
              label='Timezone'
              value={form.outlet_timezone}
              onChange={e => setForm({ ...form, outlet_timezone: e.target.value })}
            />
          </div>
          <CustomTextField
            fullWidth
            multiline
            minRows={2}
            label='Address'
            value={form.outlet_address}
            onChange={e => setForm({ ...form, outlet_address: e.target.value })}
          />
          <Divider />
          <Typography className='font-medium'>Default staff shift</Typography>
          <ShiftFields
            start={form.outlet_shift_start}
            end={form.outlet_shift_end}
            days={form.outlet_shift_days}
            onChange={shift =>
              setForm({
                ...form,
                outlet_shift_start: shift.start,
                outlet_shift_end: shift.end,
                outlet_shift_days: shift.days
              })
            }
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.outlet_status}
                onChange={e => setForm({ ...form, outlet_status: e.target.checked })}
              />
            }
            label='Active'
          />
        </FormDialog>
      )}
    </>
  )
}

export default OutletList
