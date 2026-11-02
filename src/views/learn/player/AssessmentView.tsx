'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'

// Lib Imports
import { api, errorMessage } from '@/libs/api'

// Type Imports
import type { AssignmentDetail, AttemptPayload, AttemptResult } from './types'

type Answer = { option_ids: number[]; text: string }

type Props = {
  detail: AssignmentDetail
  onSubmitted: () => void
}

const AssessmentView = ({ detail, onSubmitted }: Props) => {
  // States
  const [attempt, setAttempt] = useState<AttemptPayload | null>(null)
  const [answers, setAnswers] = useState<Record<number, Answer>>({})
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [busy, setBusy] = useState(false)

  const { assignment, version, steps } = detail
  const maxAttempts = version.mv_max_attempts
  const attemptsLeft = maxAttempts > 0 ? Math.max(0, maxAttempts - assignment.asg_attempts_used) : null
  const passed = Boolean(assignment.asg_assessment_passed_at)

  const start = async () => {
    setBusy(true)

    try {
      const res = await api.post<AttemptPayload>('/learn/attempt/start', { asg_id: assignment.asg_id })

      setAttempt(res.data)
      setAnswers({})
      setResult(null)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const setAnswer = (q_id: number, answer: Partial<Answer>) =>
    setAnswers(prev => ({
      ...prev,
      [q_id]: { option_ids: prev[q_id]?.option_ids ?? [], text: prev[q_id]?.text ?? '', ...answer }
    }))

  const unanswered = attempt
    ? attempt.questions.filter(q =>
        q.q_type === 'written' ? !answers[q.q_id]?.text?.trim() : !answers[q.q_id]?.option_ids.length
      ).length
    : 0

  const submit = async () => {
    if (!attempt) {
      return
    }

    setBusy(true)

    try {
      const res = await api.post<AttemptResult>('/learn/attempt/submit', {
        aa_id: attempt.aa_id,
        answers: attempt.questions.map(q => ({ q_id: q.q_id, ...(answers[q.q_id] || { option_ids: [], text: '' }) }))
      })

      setResult(res.data)
      setAttempt(null)
      onSubmitted()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  if (!steps.all_lessons_done) {
    return (
      <Card>
        <CardContent>
          <Alert severity='info'>Complete all lessons to unlock the assessment.</Alert>
        </CardContent>
      </Card>
    )
  }

  if (result) {
    return (
      <Card>
        <CardContent className='flex flex-col gap-5'>
          <div className='flex flex-col items-center text-center gap-2'>
            <CustomAvatar skin='light' color={result.passed ? 'success' : 'error'} size={64}>
              <i className={`${result.passed ? 'tabler-trophy' : 'tabler-mood-sad'} text-[32px]`} />
            </CustomAvatar>
            <Typography variant='h4'>{result.score}%</Typography>
            <Typography color={result.passed ? 'success.main' : 'error.main'} className='font-medium'>
              {result.passed ? 'Passed' : `Not passed — ${result.pass_mark}% needed`}
            </Typography>
            <Typography color='text.secondary'>
              {result.marks_obtained} of {result.marks_total} marks · attempt {result.attempts_used}
              {result.attempts_left !== null ? ` · ${result.attempts_left} attempts left` : ''}
            </Typography>
            {result.failed && (
              <Alert severity='error' className='mbs-2'>
                No attempts left. Your manager has been informed and will assign retraining.
              </Alert>
            )}
          </div>
          <div className='flex flex-col gap-3'>
            {result.review.map((item, index) => (
              <div key={item.q_id} className='flex flex-col gap-1 p-3 rounded border'>
                <div className='flex justify-between gap-2'>
                  <Typography className='font-medium'>
                    {index + 1}. {item.q_text}
                  </Typography>
                  {item.is_correct === null ? (
                    <Chip size='small' variant='tonal' label='Recorded' />
                  ) : (
                    <Chip
                      size='small'
                      variant='tonal'
                      color={item.is_correct ? 'success' : 'error'}
                      label={item.is_correct ? 'Correct' : 'Incorrect'}
                    />
                  )}
                </div>
                {item.explanation && <Typography color='text.secondary'>{item.explanation}</Typography>}
              </div>
            ))}
          </div>
          {!result.passed && !result.failed && (
            <Button variant='contained' className='self-center' onClick={start} disabled={busy}>
              Try again
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (attempt) {
    return (
      <Card>
        <CardContent className='flex flex-col gap-6'>
          <div className='flex flex-wrap justify-between gap-2'>
            <Typography variant='h5'>Assessment · attempt {attempt.aa_attempt_no}</Typography>
            <Typography color='text.secondary'>Pass mark {attempt.pass_mark}%</Typography>
          </div>
          {attempt.questions.map((question, index) => (
            <div key={question.q_id} className='flex flex-col gap-2'>
              <Typography className='font-medium'>
                {index + 1}. {question.q_text}
              </Typography>
              {question.q_type === 'single' && (
                <RadioGroup
                  value={answers[question.q_id]?.option_ids[0] ?? ''}
                  onChange={e => setAnswer(question.q_id, { option_ids: [Number(e.target.value)] })}
                >
                  {question.options.map(option => (
                    <FormControlLabel
                      key={option.qo_id}
                      value={option.qo_id}
                      control={<Radio />}
                      label={option.qo_text}
                    />
                  ))}
                </RadioGroup>
              )}
              {question.q_type === 'multiple' && (
                <div className='flex flex-col'>
                  <Typography variant='body2' color='text.secondary'>
                    Select all that apply
                  </Typography>
                  {question.options.map(option => {
                    const selected = answers[question.q_id]?.option_ids || []

                    return (
                      <FormControlLabel
                        key={option.qo_id}
                        label={option.qo_text}
                        control={
                          <Checkbox
                            checked={selected.includes(option.qo_id)}
                            onChange={e =>
                              setAnswer(question.q_id, {
                                option_ids: e.target.checked
                                  ? [...selected, option.qo_id]
                                  : selected.filter(id => id !== option.qo_id)
                              })
                            }
                          />
                        }
                      />
                    )
                  })}
                </div>
              )}
              {question.q_type === 'written' && (
                <CustomTextField
                  multiline
                  minRows={3}
                  fullWidth
                  placeholder='Write your answer'
                  value={answers[question.q_id]?.text || ''}
                  onChange={e => setAnswer(question.q_id, { text: e.target.value })}
                />
              )}
            </div>
          ))}
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <Typography color='text.secondary'>
              {unanswered ? `${unanswered} unanswered` : 'All questions answered'}
            </Typography>
            <Button variant='contained' onClick={submit} disabled={busy}>
              Submit answers
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const inProgress = detail.attempts.some(a => a.aa_state === 'in_progress')

  return (
    <Card>
      <CardContent className='flex flex-col items-center text-center gap-3 plb-10'>
        <CustomAvatar skin='light' color={passed ? 'success' : 'primary'} size={64}>
          <i className={`${passed ? 'tabler-circle-check' : 'tabler-checklist'} text-[32px]`} />
        </CustomAvatar>
        <Typography variant='h5'>{passed ? 'Assessment passed' : 'Assessment'}</Typography>
        <Typography color='text.secondary'>
          {version.question_count} questions · pass mark {version.mv_pass_mark}%
          {maxAttempts > 0 ? ` · ${maxAttempts} attempts allowed` : ' · unlimited attempts'}
        </Typography>
        {assignment.asg_best_score !== null && <Typography>Best score: {assignment.asg_best_score}%</Typography>}
        {detail.attempts.filter(a => a.aa_state === 'submitted').length > 0 && (
          <div className='flex flex-wrap justify-center gap-2'>
            {detail.attempts
              .filter(a => a.aa_state === 'submitted')
              .map(a => (
                <Chip
                  key={a.aa_id}
                  size='small'
                  variant='tonal'
                  color={a.aa_passed ? 'success' : 'error'}
                  label={`Attempt ${a.aa_attempt_no}: ${a.aa_score}%`}
                />
              ))}
          </div>
        )}
        {assignment.asg_state === 'failed' ? (
          <Alert severity='error'>No attempts left. Your manager will assign retraining.</Alert>
        ) : (
          !passed &&
          (attemptsLeft === null || attemptsLeft > 0 || inProgress) && (
            <Button variant='contained' onClick={start} disabled={busy}>
              {inProgress ? 'Resume assessment' : 'Start assessment'}
            </Button>
          )
        )}
      </CardContent>
    </Card>
  )
}

export default AssessmentView
