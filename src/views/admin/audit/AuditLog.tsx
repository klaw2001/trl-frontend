'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

// Component Imports
import PageHeader from '@/components/PageHeader'
import ServerTable from '@/components/ServerTable'
import SelectField from '@/components/form/SelectField'
import CustomTextField from '@core/components/mui/TextField'

// Hook Imports
import { useServerTable } from '@/hooks/useServerTable'

// Util Imports
import { formatDateTime, fullName } from '@/utils/format'

type Log = {
  al_id: number
  al_action: string
  al_entity: string
  al_entity_id: number | null
  al_meta: Record<string, any> | null
  al_ip: string | null
  al_created_at: string
  al_user: { user_employee_id: string; user_first_name: string; user_last_name: string } | null
}

const ENTITIES = [
  'user',
  'role',
  'brand',
  'outlet',
  'category',
  'training_module',
  'training_path',
  'assignment',
  'recipe',
  'video',
  'file',
  'report'
].map(value => ({ value, label: value.replace('_', ' ') }))

const AuditLog = () => {
  // Hooks
  const { rows, filters, setFilter, tableProps } = useServerTable<Log>(
    '/audit/all',
    { entity: '', action: '', from: '', to: '' },
    25
  )

  return (
    <>
      <PageHeader title='Audit Log' subtitle='Who changed what and when' />
      <Card>
        <CardContent className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <SelectField
            label=''
            options={ENTITIES}
            emptyLabel='All records'
            value={filters.entity}
            onChange={value => setFilter('entity', value || '')}
          />
          <CustomTextField
            placeholder='Action, e.g. deactivate'
            value={filters.action}
            onChange={e => setFilter('action', e.target.value)}
          />
          <CustomTextField type='date' value={filters.from} onChange={e => setFilter('from', e.target.value)} />
          <CustomTextField
            type='date'
            value={filters.to}
            onChange={e => setFilter('to', e.target.value ? `${e.target.value}T23:59:59` : '')}
          />
        </CardContent>
        <ServerTable
          {...tableProps}
          rows={rows}
          rowKey={row => row.al_id}
          columns={[
            { key: 'time', header: 'Time', render: row => formatDateTime(row.al_created_at) },
            {
              key: 'user',
              header: 'By',
              render: row => (row.al_user ? `${fullName(row.al_user)} (${row.al_user.user_employee_id})` : 'System')
            },
            {
              key: 'action',
              header: 'Action',
              render: row => <Chip size='small' variant='tonal' label={row.al_action} />
            },
            {
              key: 'entity',
              header: 'Record',
              render: row => `${row.al_entity.replace('_', ' ')}${row.al_entity_id ? ` #${row.al_entity_id}` : ''}`
            },
            {
              key: 'meta',
              header: 'Details',
              render: row => (
                <Typography variant='body2' className='max-is-[360px] truncate' title={JSON.stringify(row.al_meta)}>
                  {row.al_meta ? JSON.stringify(row.al_meta) : '—'}
                </Typography>
              )
            },
            { key: 'al_ip', header: 'IP' }
          ]}
        />
      </Card>
    </>
  )
}

export default AuditLog
