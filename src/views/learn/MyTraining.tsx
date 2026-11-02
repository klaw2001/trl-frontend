'use client'

// React Imports
import { useMemo, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import { AssignmentChip } from '@/components/StatusChip'

// Hook Imports
import { useApi } from '@/hooks/useApi'

// Lib Imports
import { api, errorMessage } from '@/libs/api'

// Type Imports
import type { MyAssignment } from '@/types/apiTypes'

// Util Imports
import { daysUntil, formatDate } from '@/utils/format'

type Available = {
  tm_id: number
  tm_code: string | null
  category: string | null
  title: string
  description: string | null
  lessons: number
}

const TABS = [
  { value: 'todo', label: 'To do' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'retraining', label: 'Retraining' },
  { value: 'completed', label: 'Completed' },
  { value: 'explore', label: 'Optional modules' }
]

const inTab = (tab: string, item: MyAssignment) => {
  switch (tab) {
    case 'overdue':
      return item.is_overdue
    case 'retraining':
      return item.asg_state === 'failed'
    case 'completed':
      return item.asg_state === 'completed'
    default:
      return (item.asg_state === 'assigned' || item.asg_state === 'in_progress') && !item.is_overdue
  }
}

const stepText = (item: MyAssignment) => {
  if (item.asg_state === 'completed') {
    return item.asg_best_score !== null ? `Score ${item.asg_best_score}%` : 'Completed'
  }

  if (item.asg_ack_only) {
    return 'Review the updated SOP and acknowledge'
  }

  const { steps } = item

  if (!steps.all_lessons_done) {
    return `${steps.lessons_done}/${steps.lessons_total} lessons`
  }

  if (!steps.assessment_done) {
    return 'Assessment pending'
  }

  return 'Acknowledgement pending'
}

const AssignmentCard = ({ item }: { item: MyAssignment }) => {
  const days = daysUntil(item.asg_due_at)

  return (
    <Card className='bs-full'>
      <CardContent className='flex flex-col gap-3 bs-full'>
        <div className='flex flex-wrap items-center gap-2'>
          <AssignmentChip state={item.asg_state} overdue={item.is_overdue} />
          {item.asg_is_mandatory && <Chip size='small' variant='outlined' label='Mandatory' />}
          {item.asg_source === 'retraining' && (
            <Chip size='small' variant='tonal' color='warning' label='Updated content' />
          )}
          {item.module.category && <Chip size='small' variant='outlined' label={item.module.category} />}
        </div>
        <div>
          <Typography variant='h5'>{item.version.mv_title}</Typography>
          <Typography variant='body2' color='text.secondary'>
            {item.module.tm_code ? `${item.module.tm_code} · ` : ''}Version {item.version.mv_version_no}
          </Typography>
        </div>
        {item.version.mv_description && (
          <Typography color='text.secondary' className='line-clamp-2'>
            {item.version.mv_description}
          </Typography>
        )}
        <div className='flex flex-col gap-1 mbs-auto'>
          <div className='flex justify-between'>
            <Typography variant='body2'>{stepText(item)}</Typography>
            <Typography variant='body2'>{item.progress}%</Typography>
          </div>
          <LinearProgress
            variant='determinate'
            value={item.progress}
            color={item.asg_state === 'completed' ? 'success' : item.is_overdue ? 'warning' : 'primary'}
          />
        </div>
        <div className='flex items-center justify-between gap-2'>
          <Typography
            variant='body2'
            color={days !== null && days < 0 && item.asg_state !== 'completed' ? 'error.main' : 'text.secondary'}
          >
            {item.asg_state === 'completed'
              ? `Completed ${formatDate(item.asg_completed_at)}`
              : item.asg_due_at
                ? `Due ${formatDate(item.asg_due_at)}`
                : 'No deadline'}
          </Typography>
          {item.is_locked ? (
            <Chip size='small' icon={<i className='tabler-lock' />} label='Complete prerequisite first' />
          ) : (
            <Button
              size='small'
              variant={item.asg_state === 'completed' ? 'tonal' : 'contained'}
              component={Link}
              href={`/my-training/${item.asg_id}`}
            >
              {item.asg_state === 'completed' ? 'Review' : item.asg_started_at ? 'Continue' : 'Start'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const MyTraining = () => {
  // Hooks
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data, loading, reload } = useApi<MyAssignment[]>('/learn/assignments')
  const available = useApi<Available[]>('/learn/available')

  // States
  const [enrolling, setEnrolling] = useState<number | null>(null)

  const tab = searchParams.get('tab') || 'todo'

  const counts = useMemo(
    () => Object.fromEntries(TABS.map(t => [t.value, (data || []).filter(item => inTab(t.value, item)).length])),
    [data]
  )

  const items = (data || []).filter(item => inTab(tab, item))

  const enroll = async (tm_id: number) => {
    setEnrolling(tm_id)

    try {
      await api.post('/learn/enroll', { tm_id })
      toast.success('Added to your training')
      await Promise.all([reload(), available.reload()])
      router.replace('/my-training?tab=todo')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setEnrolling(null)
    }
  }

  return (
    <>
      <PageHeader
        title='My Training'
        subtitle='Watch the lessons, pass the assessment and acknowledge the SOP to complete a module'
      />
      <Tabs
        value={tab}
        onChange={(_, value) => router.replace(`/my-training?tab=${value}`)}
        variant='scrollable'
        className='mbe-6'
      >
        {TABS.map(t => (
          <Tab
            key={t.value}
            value={t.value}
            label={
              t.value === 'explore'
                ? `${t.label} (${available.data?.length ?? 0})`
                : `${t.label} (${counts[t.value] ?? 0})`
            }
          />
        ))}
      </Tabs>
      {loading && <LinearProgress />}
      {tab === 'explore' ? (
        available.data && available.data.length === 0 ? (
          <Card>
            <EmptyState
              icon='tabler-books'
              title='No optional modules'
              description='Optional modules for your role will appear here.'
            />
          </Card>
        ) : (
          <Grid container spacing={6}>
            {available.data?.map(module => (
              <Grid key={module.tm_id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card className='bs-full'>
                  <CardContent className='flex flex-col gap-3 bs-full'>
                    {module.category && (
                      <Chip size='small' variant='outlined' label={module.category} className='self-start' />
                    )}
                    <Typography variant='h5'>{module.title}</Typography>
                    <Typography color='text.secondary' className='line-clamp-3'>
                      {module.description}
                    </Typography>
                    <div className='flex justify-between items-center mbs-auto'>
                      <Typography variant='body2'>{module.lessons} lessons</Typography>
                      <Button
                        size='small'
                        variant='contained'
                        disabled={enrolling === module.tm_id}
                        onClick={() => enroll(module.tm_id)}
                      >
                        Start module
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      ) : !loading && items.length === 0 ? (
        <Card>
          <EmptyState
            icon={tab === 'completed' ? 'tabler-certificate' : 'tabler-confetti'}
            title={tab === 'completed' ? 'Nothing completed yet' : 'Nothing here'}
            description={tab === 'todo' ? 'You have no pending training right now.' : undefined}
          />
        </Card>
      ) : (
        <Grid container spacing={6}>
          {items.map(item => (
            <Grid key={item.asg_id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <AssignmentCard item={item} />
            </Grid>
          ))}
        </Grid>
      )}
    </>
  )
}

export default MyTraining
