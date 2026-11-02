'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import PageHeader from '@/components/PageHeader'
import ServerTable from '@/components/ServerTable'
import SelectField from '@/components/form/SelectField'

// Hook Imports
import { useApi } from '@/hooks/useApi'
import { useOptions } from '@/hooks/useOptions'

// Lib Imports
import { downloadFile, errorMessage } from '@/libs/api'

// Util Imports
import { formatDate } from '@/utils/format'

export type SummaryRow = {
  key: number
  name: string
  employee_id?: string
  outlet?: string | null
  brand?: string | null
  role?: string | null
  assigned: number
  completed: number
  in_progress: number
  not_started: number
  failed: number
  overdue: number
  completion_rate: number
  avg_score: number | null
  last_completed_at: string | null
}

export const CompletionBar = ({ value }: { value: number }) => (
  <div className='flex items-center gap-2 min-is-[120px]'>
    <LinearProgress
      variant='determinate'
      value={value}
      className='flex-1 bs-2'
      color={value >= 80 ? 'success' : value >= 50 ? 'warning' : 'error'}
    />
    <Typography variant='body2'>{value}%</Typography>
  </div>
)

const TeamProgress = () => {
  // States
  const [filters, setFilters] = useState<{ outlet_id: number | null; role_id: number | null }>({
    outlet_id: null,
    role_id: null
  })

  // Hooks
  const router = useRouter()
  const { options: outlets } = useOptions('outlets')
  const { options: roles } = useOptions('roles')
  const { data, loading } = useApi<{ rows: SummaryRow[] }>('/report/completion', { group_by: 'employee', ...filters })

  const exportFile = async (format: 'csv' | 'xlsx') => {
    try {
      await downloadFile('/report/export', { report: 'completion', group_by: 'employee', format, ...filters })
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <>
      <PageHeader
        title='Team Progress'
        subtitle='Training completion of the people you manage'
        actions={
          <>
            <Button
              variant='tonal'
              startIcon={<i className='tabler-file-spreadsheet' />}
              onClick={() => exportFile('xlsx')}
            >
              Excel
            </Button>
            <Button variant='tonal' startIcon={<i className='tabler-file-text' />} onClick={() => exportFile('csv')}>
              CSV
            </Button>
          </>
        }
      />
      <Card>
        <CardContent className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <SelectField
            label=''
            options={outlets}
            emptyLabel='All outlets'
            value={filters.outlet_id}
            onChange={outlet_id => setFilters({ ...filters, outlet_id })}
          />
          <SelectField
            label=''
            options={roles}
            emptyLabel='All roles'
            value={filters.role_id}
            onChange={role_id => setFilters({ ...filters, role_id })}
          />
        </CardContent>
        <ServerTable
          loading={loading}
          rows={data?.rows || []}
          rowKey={row => row.key}
          onRowClick={row => router.push(`/team/${row.key}`)}
          emptyText='No assigned training in your team yet'
          columns={[
            {
              key: 'name',
              header: 'Employee',
              render: row => (
                <div className='flex flex-col'>
                  <Typography color='text.primary' className='font-medium'>
                    {row.name}
                  </Typography>
                  <Typography variant='body2'>
                    {row.employee_id} · {row.role}
                  </Typography>
                </div>
              )
            },
            { key: 'outlet', header: 'Outlet', render: row => row.outlet || '—' },
            { key: 'assigned', header: 'Assigned' },
            { key: 'completed', header: 'Done' },
            {
              key: 'overdue',
              header: 'Overdue',
              render: row => (
                <Typography color={row.overdue ? 'warning.main' : 'text.secondary'}>{row.overdue}</Typography>
              )
            },
            {
              key: 'failed',
              header: 'Failed',
              render: row => <Typography color={row.failed ? 'error.main' : 'text.secondary'}>{row.failed}</Typography>
            },
            { key: 'rate', header: 'Completion', render: row => <CompletionBar value={row.completion_rate} /> },
            { key: 'avg', header: 'Avg score', render: row => (row.avg_score !== null ? `${row.avg_score}%` : '—') },
            { key: 'last', header: 'Last completed', render: row => formatDate(row.last_completed_at) }
          ]}
        />
      </Card>
    </>
  )
}

export default TeamProgress
