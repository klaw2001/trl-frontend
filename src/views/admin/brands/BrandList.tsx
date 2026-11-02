'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import PageHeader from '@/components/PageHeader'
import ServerTable from '@/components/ServerTable'
import DebouncedInput from '@/components/DebouncedInput'
import FormDialog from '@/components/dialogs/FormDialog'
import { BooleanChip } from '@/components/StatusChip'
import CustomTextField from '@core/components/mui/TextField'

// Hook Imports
import { useServerTable } from '@/hooks/useServerTable'
import { useAuth } from '@/hooks/useAuth'

// Lib Imports
import { api } from '@/libs/api'

type Brand = {
  brand_id: number
  brand_name: string
  brand_code: string
  brand_description: string | null
  brand_status: boolean
  _count: { outlets: number; users: number }
}

const empty = { brand_name: '', brand_code: '', brand_description: '', brand_status: true }

const BrandList = () => {
  // States
  const [form, setForm] = useState<(typeof empty & { brand_id?: number }) | null>(null)

  // Hooks
  const { can } = useAuth()
  const { rows, filters, setFilter, reload, tableProps } = useServerTable<Brand>('/brand/all', { search: '' })

  const save = async () => {
    await api.post('/brand/save', form)
    toast.success('Brand saved')
    setForm(null)
    reload()
  }

  return (
    <>
      <PageHeader
        title='Brands'
        subtitle='Brands control which training and recipes staff can see'
        actions={
          can('brand', 'write') && (
            <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => setForm(empty)}>
              Add brand
            </Button>
          )
        }
      />
      <Card>
        <CardContent>
          <DebouncedInput
            value={filters.search}
            onChange={value => setFilter('search', value)}
            placeholder='Search brands'
            className='max-is-[320px]'
          />
        </CardContent>
        <ServerTable
          {...tableProps}
          rows={rows}
          rowKey={row => row.brand_id}
          columns={[
            { key: 'brand_name', header: 'Brand' },
            { key: 'brand_code', header: 'Code' },
            { key: 'outlets', header: 'Outlets', render: row => row._count.outlets },
            { key: 'users', header: 'Users', render: row => row._count.users },
            { key: 'status', header: 'Status', render: row => <BooleanChip value={row.brand_status} /> },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: row =>
                can('brand', 'write') && (
                  <IconButton
                    onClick={() => setForm({ ...empty, ...row, brand_description: row.brand_description || '' })}
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
          title={form.brand_id ? 'Edit brand' : 'Add brand'}
          onClose={() => setForm(null)}
          onSubmit={save}
        >
          <CustomTextField
            fullWidth
            label='Brand name'
            value={form.brand_name}
            onChange={e => setForm({ ...form, brand_name: e.target.value })}
          />
          <CustomTextField
            fullWidth
            label='Code'
            value={form.brand_code}
            onChange={e => setForm({ ...form, brand_code: e.target.value })}
          />
          <CustomTextField
            fullWidth
            multiline
            minRows={2}
            label='Description'
            value={form.brand_description}
            onChange={e => setForm({ ...form, brand_description: e.target.value })}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.brand_status}
                onChange={e => setForm({ ...form, brand_status: e.target.checked })}
              />
            }
            label='Active'
          />
        </FormDialog>
      )}
    </>
  )
}

export default BrandList
