'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

// Component Imports
import PageHeader from '@/components/PageHeader'
import ServerTable from '@/components/ServerTable'
import DebouncedInput from '@/components/DebouncedInput'
import FormDialog from '@/components/dialogs/FormDialog'
import SelectField from '@/components/form/SelectField'
import { ContentStateChip } from '@/components/StatusChip'
import CustomTextField from '@core/components/mui/TextField'

// Hook Imports
import { useServerTable } from '@/hooks/useServerTable'
import { useOptions } from '@/hooks/useOptions'
import { useAuth } from '@/hooks/useAuth'

// Lib Imports
import { api } from '@/libs/api'

// Util Imports
import { formatDate } from '@/utils/format'

type ModuleRow = {
  tm_id: number
  tm_code: string | null
  tm_is_mandatory: boolean
  tm_archived: boolean
  tm_brand_ids: number[]
  tm_role_ids: number[]
  title: string
  tm_category: { cat_name: string } | null
  tm_current_version: { mv_version_no: number; mv_published_at: string } | null
  draft_version: { mv_version_no: number } | null
  _count: { assignments: number }
}

const STATE_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Never published' }
]

const ARCHIVE_OPTIONS = [
  { value: '0', label: 'Active' },
  { value: '1', label: 'Archived' }
]

const ModuleList = () => {
  // States
  const [creating, setCreating] = useState<{ mv_title: string; tm_code: string; tm_category_id: number | null } | null>(
    null
  )

  // Hooks
  const router = useRouter()
  const { can } = useAuth()
  const { options: categories } = useOptions('categories', { type: 'training' })
  const { options: brands } = useOptions('brands')
  const { options: roles } = useOptions('roles')

  const { rows, filters, setFilter, tableProps } = useServerTable<ModuleRow>('/training/all', {
    search: '',
    category_id: '',
    state: '',
    archived: '0'
  })

  const audience = (ids: number[], options: { value: number | string; label: string }[], all: string) =>
    ids.length
      ? ids
          .map(id => options.find(o => o.value === id)?.label)
          .filter(Boolean)
          .join(', ')
      : all

  const create = async () => {
    const res = await api.post<{ tm_id: number }>('/training/save', creating)

    router.push(`/admin/modules/${res.data.tm_id}`)
  }

  return (
    <>
      <PageHeader
        title='Training Modules'
        subtitle='Lessons, assessments and SOP acknowledgements. Every publish creates a new version.'
        actions={
          can('training', 'write') && (
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => setCreating({ mv_title: '', tm_code: '', tm_category_id: null })}
            >
              New module
            </Button>
          )
        }
      />
      <Card>
        <CardContent className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <DebouncedInput
            value={filters.search}
            onChange={value => setFilter('search', value)}
            placeholder='Search title or code'
          />
          <SelectField
            label=''
            options={categories}
            emptyLabel='All categories'
            value={filters.category_id}
            onChange={value => setFilter('category_id', value || '')}
          />
          <SelectField
            label=''
            options={STATE_OPTIONS}
            emptyLabel='Any state'
            value={filters.state}
            onChange={value => setFilter('state', value || '')}
          />
          <SelectField
            label=''
            options={ARCHIVE_OPTIONS}
            value={filters.archived}
            onChange={value => setFilter('archived', value || '0')}
          />
        </CardContent>
        <ServerTable
          {...tableProps}
          rows={rows}
          rowKey={row => row.tm_id}
          onRowClick={row => router.push(`/admin/modules/${row.tm_id}`)}
          columns={[
            {
              key: 'title',
              header: 'Module',
              render: row => (
                <div className='flex flex-col'>
                  <Typography color='text.primary' className='font-medium'>
                    {row.title}
                  </Typography>
                  <Typography variant='body2'>
                    {[row.tm_code, row.tm_category?.cat_name].filter(Boolean).join(' · ')}
                  </Typography>
                </div>
              )
            },
            {
              key: 'audience',
              header: 'Audience',
              render: row => (
                <div className='flex flex-col'>
                  <Typography variant='body2'>{audience(row.tm_brand_ids, brands, 'All brands')}</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {audience(row.tm_role_ids, roles, 'All roles')}
                  </Typography>
                </div>
              )
            },
            {
              key: 'type',
              header: 'Type',
              render: row => (
                <Chip size='small' variant='outlined' label={row.tm_is_mandatory ? 'Mandatory' : 'Optional'} />
              )
            },
            {
              key: 'state',
              header: 'Status',
              render: row => (
                <ContentStateChip
                  published={Boolean(row.tm_current_version)}
                  draft={Boolean(row.draft_version)}
                  archived={row.tm_archived}
                />
              )
            },
            {
              key: 'version',
              header: 'Live version',
              render: row =>
                row.tm_current_version
                  ? `v${row.tm_current_version.mv_version_no} · ${formatDate(row.tm_current_version.mv_published_at)}`
                  : '—'
            },
            { key: 'assignments', header: 'Assigned', render: row => row._count.assignments }
          ]}
        />
      </Card>
      {creating && (
        <FormDialog
          open
          title='New training module'
          submitText='Create'
          onClose={() => setCreating(null)}
          onSubmit={create}
        >
          <CustomTextField
            fullWidth
            autoFocus
            label='Title'
            value={creating.mv_title}
            onChange={e => setCreating({ ...creating, mv_title: e.target.value })}
          />
          <CustomTextField
            fullWidth
            label='Code'
            placeholder='e.g. FS-101'
            value={creating.tm_code}
            onChange={e => setCreating({ ...creating, tm_code: e.target.value })}
          />
          <SelectField
            label='Category'
            options={categories}
            emptyLabel='None'
            value={creating.tm_category_id}
            onChange={value => setCreating({ ...creating, tm_category_id: value })}
          />
        </FormDialog>
      )}
    </>
  )
}

export default ModuleList
