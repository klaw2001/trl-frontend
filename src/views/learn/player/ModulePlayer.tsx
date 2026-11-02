'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'

// Component Imports
import ProtectedContent from '@/components/security/ProtectedContent'
import ShiftLockCard from '@/components/ShiftLockCard'
import EmptyState from '@/components/EmptyState'
import { AssignmentChip } from '@/components/StatusChip'
import LessonView from './LessonView'
import AssessmentView from './AssessmentView'
import AcknowledgeView from './AcknowledgeView'

// Hook Imports
import { useApi } from '@/hooks/useApi'

// Type Imports
import type { AssignmentDetail } from './types'

// Util Imports
import { formatDate, formatDuration } from '@/utils/format'

type StepKey = `lesson-${number}` | 'assessment' | 'ack'

// First step that still needs work
const firstOpenStep = (detail: AssignmentDetail): StepKey => {
  if (!detail.assignment.asg_ack_only) {
    const lesson = detail.lessons.find(l => l.lesson_is_required && !l.progress.completed_at)

    if (lesson) {
      return `lesson-${lesson.lesson_id}`
    }

    if (detail.steps.has_assessment && !detail.steps.assessment_done) {
      return 'assessment'
    }
  }

  if (detail.steps.requires_ack) {
    return 'ack'
  }

  return detail.lessons[0] ? `lesson-${detail.lessons[0].lesson_id}` : 'assessment'
}

const StepIcon = ({ done, locked, icon }: { done: boolean; locked?: boolean; icon: string }) => (
  <i
    className={
      done
        ? 'tabler-circle-check-filled text-success'
        : locked
          ? 'tabler-lock text-textDisabled'
          : `${icon} text-textSecondary`
    }
  />
)

const ModulePlayer = ({ id }: { id: string }) => {
  // Hooks
  const { data, loading, error, reload } = useApi<AssignmentDetail>(`/learn/assignment/${id}`)

  // States
  const [active, setActive] = useState<StepKey | null>(null)

  useEffect(() => {
    if (data && !active) {
      setActive(firstOpenStep(data))
    }
  }, [data, active])

  if (error?.code === 'OUTSIDE_SHIFT') {
    return <ShiftLockCard shift={error.data?.shift} />
  }

  if (error) {
    return (
      <Card>
        <EmptyState
          icon={error.data?.locked ? 'tabler-lock' : 'tabler-alert-circle'}
          title={error.message}
          description={error.data?.prerequisite ? `Prerequisite: ${error.data.prerequisite}` : undefined}
          action={
            <Button variant='tonal' component={Link} href='/my-training'>
              Back to my training
            </Button>
          }
        />
      </Card>
    )
  }

  if (loading && !data) {
    return <LinearProgress />
  }

  if (!data || !active) {
    return null
  }

  const { assignment, version, steps, lessons } = data
  const completed = assignment.asg_state === 'completed'
  const progress = steps.total_steps ? Math.round((steps.done_steps / steps.total_steps) * 100) : 0
  const activeLesson = active.startsWith('lesson-') ? lessons.find(l => `lesson-${l.lesson_id}` === active) : null

  const afterProgress = async () => {
    await reload()
  }

  return (
    <ProtectedContent>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='flex flex-col gap-1'>
            <Typography component={Link} href='/my-training' color='primary.main' className='flex items-center gap-1'>
              <i className='tabler-chevron-left' /> My training
            </Typography>
            <Typography variant='h4'>{version.mv_title}</Typography>
            <Typography color='text.secondary'>
              {data.module.tm_code ? `${data.module.tm_code} · ` : ''}Version {version.mv_version_no}
              {assignment.asg_due_at ? ` · due ${formatDate(assignment.asg_due_at)}` : ''}
            </Typography>
          </div>
          <AssignmentChip state={assignment.asg_state} overdue={assignment.is_overdue} />
        </div>

        {completed && (
          <Alert severity='success' icon={<i className='tabler-certificate' />}>
            Module completed on {formatDate(assignment.asg_completed_at)}
            {assignment.asg_best_score !== null ? ` with ${assignment.asg_best_score}%` : ''}. You can review the
            content any time during your shift.
          </Alert>
        )}
        {assignment.asg_ack_only && !completed && (
          <Alert severity='info'>This SOP was updated. Review the lessons and acknowledge the new version.</Alert>
        )}

        <Grid container spacing={6}>
          <Grid size={{ xs: 12, md: 4 }} order={{ xs: 1, md: 2 }}>
            <Card>
              <CardContent className='flex flex-col gap-2'>
                <div className='flex justify-between'>
                  <Typography className='font-medium'>Progress</Typography>
                  <Typography>{progress}%</Typography>
                </div>
                <LinearProgress variant='determinate' value={progress} color={completed ? 'success' : 'primary'} />
                {version.mv_description && (
                  <Typography variant='body2' color='text.secondary' className='mbs-2'>
                    {version.mv_description}
                  </Typography>
                )}
              </CardContent>
              <List dense>
                {lessons.map((lesson, index) => (
                  <ListItemButton
                    key={lesson.lesson_id}
                    selected={active === `lesson-${lesson.lesson_id}`}
                    onClick={() => setActive(`lesson-${lesson.lesson_id}`)}
                  >
                    <ListItemIcon>
                      <StepIcon
                        done={Boolean(lesson.progress.completed_at)}
                        icon={lesson.video ? 'tabler-player-play' : 'tabler-file-text'}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${index + 1}. ${lesson.lesson_title}`}
                      secondary={
                        lesson.video
                          ? `Video ${formatDuration(lesson.video.video_duration_seconds)}${lesson.progress.completed_at ? '' : ` · ${lesson.progress.watched_percent}% watched`}`
                          : lesson.lesson_is_required
                            ? 'Reading'
                            : 'Optional reading'
                      }
                    />
                  </ListItemButton>
                ))}
                {steps.has_assessment && (
                  <ListItemButton
                    selected={active === 'assessment'}
                    disabled={!steps.all_lessons_done}
                    onClick={() => setActive('assessment')}
                  >
                    <ListItemIcon>
                      <StepIcon done={steps.assessment_done} locked={!steps.all_lessons_done} icon='tabler-checklist' />
                    </ListItemIcon>
                    <ListItemText primary='Assessment' secondary={`Pass mark ${version.mv_pass_mark}%`} />
                  </ListItemButton>
                )}
                {steps.requires_ack && (
                  <ListItemButton
                    selected={active === 'ack'}
                    disabled={!steps.all_lessons_done || !steps.assessment_done}
                    onClick={() => setActive('ack')}
                  >
                    <ListItemIcon>
                      <StepIcon
                        done={steps.ack_done}
                        locked={!steps.all_lessons_done || !steps.assessment_done}
                        icon='tabler-signature'
                      />
                    </ListItemIcon>
                    <ListItemText primary='Acknowledge SOP' />
                  </ListItemButton>
                )}
              </List>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }} order={{ xs: 2, md: 1 }}>
            {activeLesson && (
              <LessonView
                asgId={assignment.asg_id}
                lesson={activeLesson}
                readOnly={completed}
                onCompleted={afterProgress}
              />
            )}
            {active === 'assessment' && <AssessmentView detail={data} onSubmitted={afterProgress} />}
            {active === 'ack' && <AcknowledgeView detail={data} onAcknowledged={afterProgress} />}
          </Grid>
        </Grid>
      </div>
    </ProtectedContent>
  )
}

export default ModulePlayer
