'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import PageHeader from '@/components/PageHeader'
import ServerTable from '@/components/ServerTable'
import FormDialog from '@/components/dialogs/FormDialog'
import SelectField from '@/components/form/SelectField'
import { BooleanChip } from '@/components/StatusChip'
import CustomTextField from '@core/components/mui/TextField'

// Hook Imports
import { useServerTable } from '@/hooks/useServerTable'
import { useAuth } from '@/hooks/useAuth'

// Lib Imports
import { api } from '@/libs/api'

type Category = {
  cat_id: number
  cat_name: string
  cat_type: 'training' | 'recipe'
  cat_sequence: number
  cat_status: boolean
  _count: { modules: number; recipes: number }
}

const TYPE_OPTIONS = [
  { value: 'training', label: 'Training' },
  { value: 'recipe', label: 'Recipe' }
]

const empty = { cat_name: '', cat_type: 'training', cat_sequence: 0, cat_status: true }

const CategoryList = () => {
  // States
  const [form, setForm] = useState<(typeof empty & { cat_id?: number }) | null>(null)

  // Hooks
  const { can } = useAuth()
  const { rows, filters, setFilter, reload, tableProps } = useServerTable<Category>('/category/all', { type: '' }, 50)

  const save = async () => {
    await api.post('/category/save', form)
    toast.success('Category saved')
    setForm(null)
    reload()
  }

  return (
    <>
      <PageHeader
        title='Categories'
        subtitle='Group training modules and recipes'
        actions={
          can('category', 'write') && (
            <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => setForm(empty)}>
              Add category
            </Button>
          )
        }
      />
      <Card>
        <CardContent>
          <SelectField
            className='max-is-[240px]'
            label='Type'
            options={TYPE_OPTIONS}
            emptyLabel='All types'
            value={filters.type}
            onChange={value => setFilter('type', value || '')}
          />
        </CardContent>
        <ServerTable
          {...tableProps}
          rows={rows}
          rowKey={row => row.cat_id}
          columns={[
            { key: 'cat_name', header: 'Category' },
            {
              key: 'cat_type',
              header: 'Type',
              render: row => (
                <Chip
                  size='small'
                  variant='tonal'
                  label={row.cat_type}
                  color={row.cat_type === 'training' ? 'primary' : 'info'}
                />
              )
            },
            {
              key: 'used',
              header: 'Used by',
              render: row =>
                row.cat_type === 'training' ? `${row._count.modules} modules` : `${row._count.recipes} recipes`
            },
            { key: 'cat_sequence', header: 'Order' },
            { key: 'status', header: 'Status', render: row => <BooleanChip value={row.cat_status} /> },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: row =>
                can('category', 'write') && (
                  <IconButton onClick={() => setForm({ ...empty, ...row })}>
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
          title={form.cat_id ? 'Edit category' : 'Add category'}
          onClose={() => setForm(null)}
          onSubmit={save}
        >
          <CustomTextField
            fullWidth
            label='Name'
            value={form.cat_name}
            onChange={e => setForm({ ...form, cat_name: e.target.value })}
          />
          <SelectField
            label='Type'
            options={TYPE_OPTIONS}
            value={form.cat_type}
            onChange={value => setForm({ ...form, cat_type: value })}
          />
          <CustomTextField
            fullWidth
            type='number'
            label='Display order'
            value={form.cat_sequence}
            onChange={e => setForm({ ...form, cat_sequence: Number(e.target.value) })}
          />
          <FormControlLabel
            control={
              <Switch checked={form.cat_status} onChange={e => setForm({ ...form, cat_status: e.target.checked })} />
            }
            label='Active'
          />
        </FormDialog>
      )}
    </>
  )
}

export default CategoryList
