'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import ServerTable from '@/components/ServerTable'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog'
import { AssignmentChip } from '@/components/StatusChip'
import CustomAvatar from '@core/components/mui/Avatar'

// Hook Imports
import { useApi } from '@/hooks/useApi'
import { useAuth } from '@/hooks/useAuth'

// Lib Imports
import { api, errorMessage } from '@/libs/api'

// Type Imports
import type { AssignmentState } from '@/types/apiTypes'

// Util Imports
import { formatDate, formatDateTime, fullName } from '@/utils/format'
import { getInitials } from '@/utils/getInitials'

type History = {
  user: {
    user_id: number
    user_employee_id: string
    user_first_name: string
    user_last_name: string
    user_designation: string | null
    user_status: boolean
    user_joining_date: string | null
    user_role_relation: { role_name: string }
    user_outlet: { outlet_name: string } | null
    user_brand: { brand_name: string } | null
    user_path: { tp_name: string } | null
  }
  assignments: {
    asg_id: number
    asg_state: AssignmentState
    asg_source: string
    asg_ack_only: boolean
    asg_due_at: string | null
    asg_created_at: string
    asg_completed_at: string | null
    asg_best_score: number | null
    asg_attempts_used: number
    asg_revoke_reason: string | null
    is_overdue: boolean
    asg_version: { mv_title: string; mv_version_no: number; mv_pass_mark: number }
    asg_assigned_by: { user_first_name: string; user_last_name: string } | null
    assessment_attempts: { aa_attempt_no: number; aa_score: number; aa_passed: boolean; aa_submitted_at: string }[]
    acknowledgement: { ack_created_at: string } | null
    lesson_progress: { lp_watched_percent: number; lp_completed_at: string | null }[]
  }[]
}

const UserHistory = ({ id }: { id: string }) => {
  // States
  const [retrain, setRetrain] = useState<number | null>(null)

  // Hooks
  const { can } = useAuth()
  const { data, error, reload } = useApi<History>(`/report/user/${id}`)

  if (error) {
    return <Alert severity='error'>{error.message}</Alert>
  }

  if (!data) {
    return <LinearProgress />
  }

  const { user, assignments } = data
  const count = (state: AssignmentState) => assignments.filter(a => a.asg_state === state).length

  return (
    <div className='flex flex-col gap-6'>
      <Typography component={Link} href='/team' color='primary.main' className='flex items-center gap-1'>
        <i className='tabler-chevron-left' /> Team progress
      </Typography>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card className='bs-full'>
            <CardContent className='flex gap-4'>
              <CustomAvatar skin='light' color='primary' size={64}>
                {getInitials(fullName(user))}
              </CustomAvatar>
              <div className='flex flex-col gap-1'>
                <Typography variant='h5'>{fullName(user)}</Typography>
                <Typography color='text.secondary'>
                  {user.user_employee_id} · {user.user_role_relation.role_name}
                  {user.user_designation ? ` · ${user.user_designation}` : ''}
                </Typography>
                <Typography color='text.secondary'>
                  {[user.user_outlet?.outlet_name, user.user_brand?.brand_name].filter(Boolean).join(' · ') ||
                    'No outlet'}
                </Typography>
                <Typography color='text.secondary'>
                  Path: {user.user_path?.tp_name || 'None'} · Joined {formatDate(user.user_joining_date)}
                </Typography>
                {!user.user_status && (
                  <Chip size='small' color='error' variant='tonal' label='Access removed' className='self-start' />
                )}
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card className='bs-full'>
            <CardContent className='grid grid-cols-2 sm:grid-cols-4 gap-4 bs-full items-center'>
              {[
                { label: 'Completed', value: count('completed'), color: 'success.main' },
                { label: 'Open', value: count('assigned') + count('in_progress'), color: 'info.main' },
                { label: 'Overdue', value: assignments.filter(a => a.is_overdue).length, color: 'warning.main' },
                { label: 'Failed', value: count('failed'), color: 'error.main' }
              ].map(stat => (
                <div key={stat.label} className='text-center'>
                  <Typography variant='h3' color={stat.color}>
                    {stat.value}
                  </Typography>
                  <Typography color='text.secondary'>{stat.label}</Typography>
                </div>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Card>
        <CardHeader
          title='Training history'
          subheader='Every assignment, including retraining, with the version completed'
        />
        <ServerTable
          rows={assignments}
          rowKey={row => row.asg_id}
          emptyText='No training assigned yet'
          columns={[
            {
              key: 'module',
              header: 'Module',
              render: row => (
                <div className='flex flex-col'>
                  <Typography color='text.primary' className='font-medium'>
                    {row.asg_version.mv_title}
                  </Typography>
                  <Typography variant='body2'>
                    v{row.asg_version.mv_version_no} · {row.asg_source}
                    {row.asg_ack_only ? ' (acknowledgement only)' : ''}
                  </Typography>
                </div>
              )
            },
            {
              key: 'state',
              header: 'Status',
              render: row => <AssignmentChip state={row.asg_state} overdue={row.is_overdue} />
            },
            { key: 'assigned', header: 'Assigned', render: row => formatDate(row.asg_created_at) },
            { key: 'due', header: 'Due', render: row => formatDate(row.asg_due_at) },
            {
              key: 'attempts',
              header: 'Attempts',
              render: row =>
                row.assessment_attempts.length ? (
                  <div className='flex flex-wrap gap-1'>
                    {row.assessment_attempts.map(a => (
                      <Chip
                        key={a.aa_attempt_no}
                        size='small'
                        variant='tonal'
                        color={a.aa_passed ? 'success' : 'error'}
                        label={`${a.aa_score}%`}
                        title={formatDateTime(a.aa_submitted_at)}
                      />
                    ))}
                  </div>
                ) : (
                  '—'
                )
            },
            { key: 'ack', header: 'Acknowledged', render: row => formatDateTime(row.acknowledgement?.ack_created_at) },
            { key: 'completed', header: 'Completed', render: row => formatDate(row.asg_completed_at) },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: row =>
                can('assignment', 'write') &&
                row.asg_state === 'failed' && (
                  <Button size='small' variant='tonal' color='warning' onClick={() => setRetrain(row.asg_id)}>
                    Retrain
                  </Button>
                )
            }
          ]}
        />
      </Card>
      <ConfirmDialog
        open={Boolean(retrain)}
        title='Assign retraining'
        confirmText='Assign'
        description='A new assignment on the current version is created. The failed attempt stays in the history.'
        onClose={() => setRetrain(null)}
        onConfirm={async () => {
          try {
            await api.post('/assignment/retrain', { asg_ids: [retrain] })
            toast.success('Retraining assigned')
            setRetrain(null)
            reload()
          } catch (err) {
            toast.error(errorMessage(err))
          }
        }}
      />
    </div>
  )
}

export default UserHistory
