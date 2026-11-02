'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import PageHeader from '@/components/PageHeader'
import ServerTable from '@/components/ServerTable'
import DebouncedInput from '@/components/DebouncedInput'
import FormDialog from '@/components/dialogs/FormDialog'
import SelectField from '@/components/form/SelectField'
import MultiSelectField from '@/components/form/MultiSelectField'
import { AssignmentChip } from '@/components/StatusChip'
import CustomTextField from '@core/components/mui/TextField'

// Hook Imports
import { useServerTable } from '@/hooks/useServerTable'
import { useOptions } from '@/hooks/useOptions'
import { useAuth } from '@/hooks/useAuth'

// Lib Imports
import { api } from '@/libs/api'

// Type Imports
import type { AssignmentState } from '@/types/apiTypes'

// Util Imports
import { formatDate, fullName } from '@/utils/format'

type Row = {
  asg_id: number
  asg_state: AssignmentState
  asg_source: string
  asg_due_at: string | null
  asg_best_score: number | null
  asg_attempts_used: number
  asg_completed_at: string | null
  is_overdue: boolean
  asg_user: {
    user_id: number
    user_employee_id: string
    user_first_name: string
    user_last_name: string
    user_outlet: { outlet_name: string } | null
  }
  asg_version: { mv_title: string; mv_version_no: number; mv_max_attempts: number }
}

type AssignForm = {
  module_ids: number[]
  mode: 'users' | 'group'
  user_ids: number[]
  brand_id: number | null
  outlet_id: number | null
  role_id: number | null
  due_at: string
}

const VIEWS = [
  { value: 'open', label: 'Open', query: { state: 'open', overdue: '' } },
  { value: 'overdue', label: 'Overdue', query: { state: '', overdue: '1' } },
  { value: 'failed', label: 'Failed', query: { state: 'failed', overdue: '' } },
  { value: 'completed', label: 'Completed', query: { state: 'completed', overdue: '' } },
  { value: 'revoked', label: 'Revoked', query: { state: 'revoked', overdue: '' } }
]

const AssignmentList = () => {
  // States
  const [view, setView] = useState('open')
  const [selected, setSelected] = useState<number[]>([])
  const [assignForm, setAssignForm] = useState<AssignForm | null>(null)
  const [bulk, setBulk] = useState<'due' | 'revoke' | 'retrain' | null>(null)
  const [dueAt, setDueAt] = useState('')
  const [reason, setReason] = useState('')

  // Hooks
  const { can } = useAuth()
  const { options: modules } = useOptions('training-modules')
  const { options: users } = useOptions('users')
  const { options: brands } = useOptions('brands')
  const { options: outlets } = useOptions('outlets')
  const { options: roles } = useOptions('roles')

  const { rows, filters, setFilter, reload, tableProps } = useServerTable<Row>('/assignment/all', {
    search: '',
    module_id: '',
    outlet_id: '',
    state: 'open',
    overdue: ''
  })

  const canWrite = can('assignment', 'write')

  const changeView = (value: string) => {
    const config = VIEWS.find(v => v.value === value)!

    setView(value)
    setSelected([])
    setFilter('state', config.query.state)
    setFilter('overdue', config.query.overdue)
  }

  const assign = async () => {
    if (!assignForm) {
      return
    }

    const res = await api.post<{ created: number; users: number }>('/assignment/assign', {
      module_ids: assignForm.module_ids,
      due_at: assignForm.due_at ? `${assignForm.due_at}T23:59:59` : undefined,
      ...(assignForm.mode === 'users'
        ? { user_ids: assignForm.user_ids }
        : { brand_id: assignForm.brand_id, outlet_id: assignForm.outlet_id, role_id: assignForm.role_id })
    })

    toast.success(
      `${res.data.created} assignments created for ${res.data.users} users (already assigned users are skipped)`
    )
    setAssignForm(null)
    reload()
  }

  const runBulk = async () => {
    const paths = { due: '/assignment/due-date', revoke: '/assignment/revoke', retrain: '/assignment/retrain' }

    const res = await api.post(paths[bulk!], {
      asg_ids: selected,
      due_at: dueAt ? `${dueAt}T23:59:59` : null,
      reason
    })

    toast.success(res.message)
    setBulk(null)
    setSelected([])
    setDueAt('')
    setReason('')
    reload()
  }

  const toggle = (asg_id: number) =>
    setSelected(prev => (prev.includes(asg_id) ? prev.filter(id => id !== asg_id) : [...prev, asg_id]))

  return (
    <>
      <PageHeader
        title='Assignments'
        subtitle='Assign modules to people or groups, extend deadlines and assign retraining'
        actions={
          canWrite && (
            <Button
              variant='contained'
              startIcon={<i className='tabler-clipboard-plus' />}
              onClick={() =>
                setAssignForm({
                  module_ids: [],
                  mode: 'users',
                  user_ids: [],
                  brand_id: null,
                  outlet_id: null,
                  role_id: null,
                  due_at: ''
                })
              }
            >
              Assign training
            </Button>
          )
        }
      />
      <Tabs value={view} onChange={(_, value) => changeView(value)} className='mbe-4' variant='scrollable'>
        {VIEWS.map(v => (
          <Tab key={v.value} value={v.value} label={v.label} />
        ))}
      </Tabs>
      <Card>
        <CardContent className='flex flex-col gap-4'>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <DebouncedInput
              value={filters.search}
              onChange={value => setFilter('search', value)}
              placeholder='Employee or module'
            />
            <SelectField
              label=''
              options={modules}
              emptyLabel='All modules'
              value={filters.module_id}
              onChange={value => setFilter('module_id', value || '')}
            />
            <SelectField
              label=''
              options={outlets}
              emptyLabel='All outlets'
              value={filters.outlet_id}
              onChange={value => setFilter('outlet_id', value || '')}
            />
          </div>
          {canWrite && selected.length > 0 && (
            <div className='flex flex-wrap items-center gap-2'>
              <Typography>{selected.length} selected</Typography>
              <Button size='small' variant='tonal' onClick={() => setBulk('due')}>
                Change deadline
              </Button>
              <Button size='small' variant='tonal' color='warning' onClick={() => setBulk('retrain')}>
                Assign retraining
              </Button>
              <Button size='small' variant='tonal' color='error' onClick={() => setBulk('revoke')}>
                Revoke
              </Button>
            </div>
          )}
        </CardContent>
        <ServerTable
          {...tableProps}
          rows={rows}
          rowKey={row => row.asg_id}
          columns={[
            ...(canWrite
              ? [
                  {
                    key: 'select',
                    header: (
                      <Checkbox
                        checked={rows.length > 0 && rows.every(r => selected.includes(r.asg_id))}
                        onChange={e => setSelected(e.target.checked ? rows.map(r => r.asg_id) : [])}
                      />
                    ),
                    render: (row: Row) => (
                      <Checkbox checked={selected.includes(row.asg_id)} onChange={() => toggle(row.asg_id)} />
                    )
                  }
                ]
              : []),
            {
              key: 'user',
              header: 'Employee',
              render: row => (
                <Link href={`/team/${row.asg_user.user_id}`} className='flex flex-col'>
                  <Typography color='text.primary' className='font-medium'>
                    {fullName(row.asg_user)}
                  </Typography>
                  <Typography variant='body2'>
                    {row.asg_user.user_employee_id} · {row.asg_user.user_outlet?.outlet_name || 'No outlet'}
                  </Typography>
                </Link>
              )
            },
            {
              key: 'module',
              header: 'Module',
              render: row => `${row.asg_version.mv_title} (v${row.asg_version.mv_version_no})`
            },
            { key: 'source', header: 'Source', render: row => row.asg_source },
            { key: 'due', header: 'Due', render: row => formatDate(row.asg_due_at) },
            {
              key: 'state',
              header: 'Status',
              render: row => <AssignmentChip state={row.asg_state} overdue={row.is_overdue} />
            },
            {
              key: 'score',
              header: 'Attempts / best',
              render: row =>
                row.asg_attempts_used
                  ? `${row.asg_attempts_used}${row.asg_version.mv_max_attempts ? `/${row.asg_version.mv_max_attempts}` : ''} · ${row.asg_best_score ?? 0}%`
                  : '—'
            }
          ]}
        />
      </Card>

      {assignForm && (
        <FormDialog
          open
          maxWidth='md'
          title='Assign training'
          submitText='Assign'
          onClose={() => setAssignForm(null)}
          onSubmit={assign}
          disabled={!assignForm.module_ids.length}
        >
          <MultiSelectField
            label='Modules'
            options={modules}
            value={assignForm.module_ids}
            onChange={module_ids => setAssignForm({ ...assignForm, module_ids })}
          />
          <Tabs value={assignForm.mode} onChange={(_, mode) => setAssignForm({ ...assignForm, mode })}>
            <Tab value='users' label='Selected people' />
            <Tab value='group' label='Group' />
          </Tabs>
          {assignForm.mode === 'users' ? (
            <MultiSelectField
              label='People'
              options={users}
              value={assignForm.user_ids}
              onChange={user_ids => setAssignForm({ ...assignForm, user_ids })}
            />
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <SelectField
                label='Brand'
                options={brands}
                emptyLabel='Any'
                value={assignForm.brand_id}
                onChange={brand_id => setAssignForm({ ...assignForm, brand_id })}
              />
              <SelectField
                label='Outlet'
                options={outlets}
                emptyLabel='Any'
                value={assignForm.outlet_id}
                onChange={outlet_id => setAssignForm({ ...assignForm, outlet_id })}
              />
              <SelectField
                label='Role'
                options={roles}
                emptyLabel='Any'
                value={assignForm.role_id}
                onChange={role_id => setAssignForm({ ...assignForm, role_id })}
              />
            </div>
          )}
          <CustomTextField
            type='date'
            label='Due date'
            helperText='Empty = module default deadline'
            value={assignForm.due_at}
            onChange={e => setAssignForm({ ...assignForm, due_at: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </FormDialog>
      )}

      <FormDialog
        open={Boolean(bulk)}
        title={bulk === 'due' ? 'Change deadline' : bulk === 'retrain' ? 'Assign retraining' : 'Revoke assignments'}
        submitText='Apply'
        onClose={() => setBulk(null)}
        onSubmit={runBulk}
      >
        {bulk === 'due' && (
          <CustomTextField
            type='date'
            label='New due date'
            value={dueAt}
            onChange={e => setDueAt(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        )}
        {bulk === 'retrain' && (
          <Typography color='text.secondary'>
            Each selected learner gets a new assignment on the current version. Earlier attempts and results stay in
            their history.
          </Typography>
        )}
        {bulk === 'revoke' && (
          <>
            <Typography color='text.secondary'>
              Open assignments are withdrawn. Completed records are not changed.
            </Typography>
            <CustomTextField fullWidth label='Reason' value={reason} onChange={e => setReason(e.target.value)} />
          </>
        )}
      </FormDialog>
    </>
  )
}

export default AssignmentList
