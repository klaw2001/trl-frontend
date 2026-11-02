'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
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
import MultiSelectField from '@/components/form/MultiSelectField'
import CustomTextField from '@core/components/mui/TextField'

// Hook Imports
import { useServerTable } from '@/hooks/useServerTable'
import { useOptions } from '@/hooks/useOptions'
import { useAuth } from '@/hooks/useAuth'

// Lib Imports
import { api } from '@/libs/api'

type PathRow = {
  tp_id: number
  tp_name: string
  tp_description: string | null
  tp_role: { role_name: string } | null
  tp_brand: { brand_name: string } | null
  _count: { modules: number; users: number }
}

type PathForm = {
  tp_id?: number
  tp_name: string
  tp_description: string
  tp_role_id: number | null
  tp_brand_id: number | null
  modules: { module_id: number; due_days: number | null }[]
}

const emptyPath: PathForm = { tp_name: '', tp_description: '', tp_role_id: null, tp_brand_id: null, modules: [] }

const PathList = () => {
  // States
  const [form, setForm] = useState<PathForm | null>(null)

  const [assigning, setAssigning] = useState<{
    tp_id: number
    tp_name: string
    user_ids: number[]
    deadline: string
    set_default: boolean
  } | null>(null)

  // Hooks
  const { can } = useAuth()
  const { options: roles } = useOptions('roles')
  const { options: brands } = useOptions('brands')
  const { options: modules } = useOptions('training-modules')
  const { options: users } = useOptions('users')
  const { rows, reload, tableProps } = useServerTable<PathRow>('/path/all', {}, 25)

  const canWrite = can('path', 'write')

  const open = async (row?: PathRow) => {
    if (!row) {
      setForm(emptyPath)

      return
    }

    const res = await api.get(`/path/single/${row.tp_id}`)

    setForm({
      tp_id: res.data.tp_id,
      tp_name: res.data.tp_name,
      tp_description: res.data.tp_description || '',
      tp_role_id: res.data.tp_role_id,
      tp_brand_id: res.data.tp_brand_id,
      modules: res.data.modules.map((m: any) => ({ module_id: m.tpm_module_id, due_days: m.tpm_due_days }))
    })
  }

  const save = async () => {
    await api.post('/path/save', form)
    toast.success('Training path saved')
    setForm(null)
    reload()
  }

  const assign = async () => {
    const res = await api.post<{ users: number; created: number }>('/path/assign', {
      ...assigning,
      deadline: assigning?.deadline || null
    })

    toast.success(`${res.data.created} assignments created for ${res.data.users} users`)
    setAssigning(null)
    reload()
  }

  const moveModule = (index: number, offset: number) => {
    if (!form) {
      return
    }

    const list = [...form.modules]
    const [moved] = list.splice(index, 1)

    list.splice(index + offset, 0, moved)
    setForm({ ...form, modules: list })
  }

  return (
    <>
      <PageHeader
        title='Training Paths'
        subtitle='Ordered sets of modules for team members, in-charges and franchisees'
        actions={
          canWrite && (
            <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => open()}>
              New path
            </Button>
          )
        }
      />
      <Card>
        <ServerTable
          {...tableProps}
          rows={rows}
          rowKey={row => row.tp_id}
          columns={[
            {
              key: 'tp_name',
              header: 'Path',
              render: row => (
                <div className='flex flex-col'>
                  <Typography color='text.primary' className='font-medium'>
                    {row.tp_name}
                  </Typography>
                  <Typography variant='body2'>{row.tp_description}</Typography>
                </div>
              )
            },
            { key: 'role', header: 'For role', render: row => row.tp_role?.role_name || 'Any' },
            { key: 'brand', header: 'Brand', render: row => row.tp_brand?.brand_name || 'All' },
            { key: 'modules', header: 'Modules', render: row => row._count.modules },
            { key: 'users', header: 'Users on path', render: row => row._count.users },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: row =>
                canWrite && (
                  <div className='flex justify-end gap-1'>
                    <Button
                      size='small'
                      variant='tonal'
                      onClick={() =>
                        setAssigning({
                          tp_id: row.tp_id,
                          tp_name: row.tp_name,
                          user_ids: [],
                          deadline: '',
                          set_default: true
                        })
                      }
                    >
                      Assign
                    </Button>
                    <IconButton onClick={() => open(row)}>
                      <i className='tabler-edit' />
                    </IconButton>
                  </div>
                )
            }
          ]}
        />
      </Card>

      {form && (
        <FormDialog
          open
          maxWidth='md'
          title={form.tp_id ? 'Edit training path' : 'New training path'}
          onClose={() => setForm(null)}
          onSubmit={save}
        >
          <CustomTextField
            fullWidth
            label='Name'
            value={form.tp_name}
            onChange={e => setForm({ ...form, tp_name: e.target.value })}
          />
          <CustomTextField
            fullWidth
            label='Description'
            value={form.tp_description}
            onChange={e => setForm({ ...form, tp_description: e.target.value })}
          />
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <SelectField
              label='For role'
              options={roles}
              emptyLabel='Any role'
              value={form.tp_role_id}
              onChange={value => setForm({ ...form, tp_role_id: value })}
            />
            <SelectField
              label='Brand'
              options={brands}
              emptyLabel='All brands'
              value={form.tp_brand_id}
              onChange={value => setForm({ ...form, tp_brand_id: value })}
            />
          </div>
          <SelectField
            label='Add module'
            options={modules.filter(m => !form.modules.some(pm => pm.module_id === m.value))}
            value={null}
            emptyLabel='Select a published module'
            onChange={value =>
              value && setForm({ ...form, modules: [...form.modules, { module_id: value, due_days: null }] })
            }
          />
          {form.modules.map((item, index) => (
            <div key={item.module_id} className='flex flex-wrap items-center gap-2 p-2 border rounded'>
              <Typography className='font-medium'>{index + 1}.</Typography>
              <Typography className='flex-1'>
                {modules.find(m => m.value === item.module_id)?.label || `Module #${item.module_id}`}
              </Typography>
              <CustomTextField
                size='small'
                type='number'
                placeholder='Default'
                label='Due days'
                className='is-[110px]'
                value={item.due_days ?? ''}
                onChange={e =>
                  setForm({
                    ...form,
                    modules: form.modules.map(m =>
                      m.module_id === item.module_id
                        ? { ...m, due_days: e.target.value ? Number(e.target.value) : null }
                        : m
                    )
                  })
                }
              />
              <IconButton size='small' disabled={index === 0} onClick={() => moveModule(index, -1)}>
                <i className='tabler-arrow-up' />
              </IconButton>
              <IconButton
                size='small'
                disabled={index === form.modules.length - 1}
                onClick={() => moveModule(index, 1)}
              >
                <i className='tabler-arrow-down' />
              </IconButton>
              <IconButton
                size='small'
                onClick={() => setForm({ ...form, modules: form.modules.filter(m => m.module_id !== item.module_id) })}
              >
                <i className='tabler-x' />
              </IconButton>
            </div>
          ))}
        </FormDialog>
      )}

      {assigning && (
        <FormDialog
          open
          title={`Assign “${assigning.tp_name}”`}
          submitText='Assign'
          onClose={() => setAssigning(null)}
          onSubmit={assign}
          disabled={!assigning.user_ids.length}
        >
          <MultiSelectField
            label='Users'
            options={users}
            value={assigning.user_ids}
            onChange={user_ids => setAssigning({ ...assigning, user_ids })}
          />
          <CustomTextField
            type='date'
            label='Complete by'
            helperText='Empty = each module’s default deadline'
            value={assigning.deadline}
            onChange={e => setAssigning({ ...assigning, deadline: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={assigning.set_default}
                onChange={e => setAssigning({ ...assigning, set_default: e.target.checked })}
              />
            }
            label='Set as the users’ required path (new modules added later are assigned automatically)'
          />
        </FormDialog>
      )}
    </>
  )
}

export default PathList
