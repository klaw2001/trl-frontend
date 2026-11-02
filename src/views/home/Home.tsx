'use client'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import { AssignmentChip } from '@/components/StatusChip'
import EmptyState from '@/components/EmptyState'

// Hook Imports
import { useAuth } from '@/hooks/useAuth'
import { useApi } from '@/hooks/useApi'

// Type Imports
import type { AssignmentState, ShiftAccess } from '@/types/apiTypes'
import type { ThemeColor } from '@core/types'

// Util Imports
import { daysUntil, formatDate, formatTime } from '@/utils/format'

type HomeData = {
  counts: { pending: number; in_progress: number; overdue: number; failed: number; completed: number }
  upcoming: {
    asg_id: number
    asg_state: AssignmentState
    asg_due_at: string | null
    asg_ack_only: boolean
    asg_version: { mv_title: string }
  }[]
  unread_notifications: number
  shift: ShiftAccess
}

type TeamTotals = {
  totals: { learners: number; assigned: number; completion_rate: number; overdue: number; failed: number }
}

const STATS: { key: keyof HomeData['counts']; label: string; icon: string; color: ThemeColor; tab: string }[] = [
  { key: 'pending', label: 'Not started', icon: 'tabler-player-play', color: 'primary', tab: 'todo' },
  { key: 'in_progress', label: 'In progress', icon: 'tabler-progress', color: 'info', tab: 'todo' },
  { key: 'overdue', label: 'Overdue', icon: 'tabler-alarm', color: 'warning', tab: 'overdue' },
  { key: 'failed', label: 'Retraining', icon: 'tabler-refresh-alert', color: 'error', tab: 'retraining' },
  { key: 'completed', label: 'Completed', icon: 'tabler-circle-check', color: 'success', tab: 'completed' }
]

const Home = () => {
  // Hooks
  const { profile, can } = useAuth()
  const { data, loading } = useApi<HomeData>('/home')
  const team = useApi<TeamTotals>(can('report') ? '/report/dashboard' : null)

  const user = profile?.user
  const shift = data?.shift

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Card className='bs-full'>
          <CardContent className='flex flex-col gap-2'>
            <Typography variant='h4'>Hello, {user?.user_first_name} 👋</Typography>
            <Typography color='text.secondary'>
              {user?.user_role_relation.role_name}
              {user?.user_outlet ? ` · ${user.user_outlet.outlet_name}` : ''}
              {user?.user_brand ? ` · ${user.user_brand.brand_name}` : ''}
            </Typography>
            {shift?.restricted && (
              <Typography color={shift.allowed ? 'success.main' : 'warning.main'}>
                {shift.allowed
                  ? `Training and recipes are open until ${formatTime(shift.ends_at)}.`
                  : `Content opens during your shift (${shift.start} – ${shift.end}).`}
              </Typography>
            )}
            <div className='flex flex-wrap gap-3 mbs-2'>
              <Button
                variant='contained'
                component={Link}
                href='/my-training'
                startIcon={<i className='tabler-school' />}
              >
                Continue training
              </Button>
              <Button variant='tonal' component={Link} href='/recipes' startIcon={<i className='tabler-chef-hat' />}>
                Recipe library
              </Button>
            </div>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card className='bs-full'>
          <CardContent className='flex items-center gap-4 bs-full'>
            <CustomAvatar skin='light' color='primary' size={56}>
              <i className='tabler-bell text-[28px]' />
            </CustomAvatar>
            <div className='flex flex-col'>
              <Typography variant='h4'>{data?.unread_notifications ?? '—'}</Typography>
              <Typography color='text.secondary'>Unread notifications</Typography>
              <Typography component={Link} href='/notifications' color='primary.main'>
                View all
              </Typography>
            </div>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={12}>
        <Grid container spacing={6}>
          {STATS.map(stat => (
            <Grid key={stat.key} size={{ xs: 6, sm: 4, md: 'grow' }}>
              <Card component={Link} href={`/my-training?tab=${stat.tab}`} className='block bs-full'>
                <CardContent className='flex flex-col gap-2'>
                  <CustomAvatar skin='light' color={stat.color} variant='rounded'>
                    <i className={stat.icon} />
                  </CustomAvatar>
                  <Typography variant='h4'>{loading ? '—' : data?.counts[stat.key]}</Typography>
                  <Typography color='text.secondary' noWrap>
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>
      <Grid size={{ xs: 12, md: can('report') ? 7 : 12 }}>
        <Card className='bs-full'>
          <CardHeader title='Up next' subheader='Assigned training sorted by deadline' />
          <CardContent className='flex flex-col gap-4'>
            {data && data.upcoming.length === 0 && (
              <EmptyState icon='tabler-confetti' title='All caught up' description='You have no pending training.' />
            )}
            {data?.upcoming.map(item => {
              const days = daysUntil(item.asg_due_at)

              return (
                <Link
                  key={item.asg_id}
                  href={`/my-training/${item.asg_id}`}
                  className='flex items-center justify-between gap-4 p-3 rounded border hover:bg-actionHover'
                >
                  <div className='flex flex-col'>
                    <Typography className='font-medium' color='text.primary'>
                      {item.asg_version.mv_title}
                      {item.asg_ack_only ? ' (acknowledge update)' : ''}
                    </Typography>
                    <Typography variant='body2' color={days !== null && days < 0 ? 'error.main' : 'text.secondary'}>
                      {item.asg_due_at
                        ? days !== null && days < 0
                          ? `Overdue since ${formatDate(item.asg_due_at)}`
                          : `Due ${formatDate(item.asg_due_at)}`
                        : 'No deadline'}
                    </Typography>
                  </div>
                  <AssignmentChip state={item.asg_state} overdue={days !== null && days < 0} />
                </Link>
              )
            })}
          </CardContent>
        </Card>
      </Grid>
      {can('report') && (
        <Grid size={{ xs: 12, md: 5 }}>
          <Card className='bs-full'>
            <CardHeader title='Team training' subheader='People you manage' />
            <CardContent className='flex flex-col gap-4'>
              {team.data ? (
                <>
                  <div className='flex justify-between'>
                    <Typography>Completion</Typography>
                    <Typography className='font-medium'>{team.data.totals.completion_rate}%</Typography>
                  </div>
                  <LinearProgress variant='determinate' value={team.data.totals.completion_rate} className='bs-2' />
                  <div className='grid grid-cols-3 gap-2 text-center'>
                    <div>
                      <Typography variant='h5'>{team.data.totals.learners}</Typography>
                      <Typography variant='body2'>Learners</Typography>
                    </div>
                    <div>
                      <Typography variant='h5' color='warning.main'>
                        {team.data.totals.overdue}
                      </Typography>
                      <Typography variant='body2'>Overdue</Typography>
                    </div>
                    <div>
                      <Typography variant='h5' color='error.main'>
                        {team.data.totals.failed}
                      </Typography>
                      <Typography variant='body2'>Failed</Typography>
                    </div>
                  </div>
                  <Button variant='tonal' component={Link} href='/reports'>
                    Open reports
                  </Button>
                </>
              ) : (
                <LinearProgress />
              )}
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  )
}

export default Home
