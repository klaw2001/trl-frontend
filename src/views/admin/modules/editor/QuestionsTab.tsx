'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Radio from '@mui/material/Radio'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import FormDialog from '@/components/dialogs/FormDialog'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog'
import SelectField from '@/components/form/SelectField'
import EmptyState from '@/components/EmptyState'
import CustomTextField from '@core/components/mui/TextField'

// Lib Imports
import { api, errorMessage } from '@/libs/api'

// Type Imports
import type { QuestionRow, VersionDetail } from './types'

type QuestionForm = {
  q_id?: number
  q_type: QuestionRow['q_type']
  q_text: string
  q_explanation: string
  q_marks: number
  options: { qo_text: string; qo_is_correct: boolean }[]
}

const TYPES = [
  { value: 'single', label: 'Single choice' },
  { value: 'multiple', label: 'Multiple answers' },
  { value: 'written', label: 'Written response (not scored)' }
]

const emptyQuestion: QuestionForm = {
  q_type: 'single',
  q_text: '',
  q_explanation: '',
  q_marks: 1,
  options: [
    { qo_text: '', qo_is_correct: true },
    { qo_text: '', qo_is_correct: false }
  ]
}

type Props = {
  version: VersionDetail
  readOnly: boolean
  onChanged: () => void
}

const QuestionsTab = ({ version, readOnly, onChanged }: Props) => {
  // States
  const [form, setForm] = useState<QuestionForm | null>(null)
  const [removing, setRemoving] = useState<QuestionRow | null>(null)

  const setOption = (index: number, value: Partial<QuestionForm['options'][number]>) => {
    if (!form) {
      return
    }

    const options = form.options.map((option, i) => {
      if (i === index) {
        return { ...option, ...value }
      }

      // Single choice keeps exactly one correct option
      return form.q_type === 'single' && value.qo_is_correct ? { ...option, qo_is_correct: false } : option
    })

    setForm({ ...form, options })
  }

  const save = async () => {
    await api.post('/training/question/save', { ...form, q_version_id: version.mv_id })
    toast.success('Question saved')
    setForm(null)
    onChanged()
  }

  const gradable = version.questions.filter(q => q.q_type !== 'written').length

  return (
    <Card>
      <CardHeader
        title='Assessment'
        subheader={`${version.questions.length} questions (${gradable} scored) · pass mark ${version.mv_pass_mark}% · ${
          version.mv_max_attempts ? `${version.mv_max_attempts} attempts` : 'unlimited attempts'
        }${version.mv_question_limit ? ` · ${version.mv_question_limit} random per attempt` : ''}`}
        action={
          !readOnly && (
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => setForm(emptyQuestion)}
            >
              Add question
            </Button>
          )
        }
      />
      {version.questions.length === 0 && (
        <EmptyState
          icon='tabler-checklist'
          title='No questions'
          description='Without questions the module completes after lessons and acknowledgement.'
        />
      )}
      {version.questions.map((question, index) => (
        <div key={question.q_id} className='flex gap-4 pli-6 plb-4 border-bs'>
          <Typography className='font-medium'>{index + 1}.</Typography>
          <div className='flex flex-col gap-2 flex-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <Typography color='text.primary' className='font-medium'>
                {question.q_text}
              </Typography>
              <Chip size='small' variant='outlined' label={TYPES.find(t => t.value === question.q_type)?.label} />
              {question.q_type !== 'written' && (
                <Chip
                  size='small'
                  variant='outlined'
                  label={`${question.q_marks} mark${question.q_marks > 1 ? 's' : ''}`}
                />
              )}
            </div>
            {question.options.map(option => (
              <Typography
                key={option.qo_id}
                color={option.qo_is_correct ? 'success.main' : 'text.secondary'}
                className='flex items-center gap-2'
              >
                <i className={option.qo_is_correct ? 'tabler-circle-check' : 'tabler-circle'} /> {option.qo_text}
              </Typography>
            ))}
            {question.q_explanation && (
              <Typography variant='body2' color='text.secondary'>
                Explanation: {question.q_explanation}
              </Typography>
            )}
          </div>
          {!readOnly && (
            <div className='flex items-start'>
              <IconButton
                onClick={() =>
                  setForm({
                    q_id: question.q_id,
                    q_type: question.q_type,
                    q_text: question.q_text,
                    q_explanation: question.q_explanation || '',
                    q_marks: question.q_marks,
                    options: question.options.map(o => ({ qo_text: o.qo_text, qo_is_correct: o.qo_is_correct }))
                  })
                }
              >
                <i className='tabler-edit' />
              </IconButton>
              <IconButton color='error' onClick={() => setRemoving(question)}>
                <i className='tabler-trash' />
              </IconButton>
            </div>
          )}
        </div>
      ))}

      {form && (
        <FormDialog
          open
          maxWidth='md'
          title={form.q_id ? 'Edit question' : 'Add question'}
          onClose={() => setForm(null)}
          onSubmit={save}
        >
          <SelectField
            label='Type'
            options={TYPES}
            value={form.q_type}
            onChange={q_type =>
              setForm({
                ...form,
                q_type,
                options:
                  q_type === 'single' && form.options.filter(o => o.qo_is_correct).length !== 1
                    ? form.options.map((o, i) => ({ ...o, qo_is_correct: i === 0 }))
                    : form.options
              })
            }
          />
          <CustomTextField
            fullWidth
            multiline
            minRows={2}
            label='Question'
            value={form.q_text}
            onChange={e => setForm({ ...form, q_text: e.target.value })}
          />
          {form.q_type !== 'written' && (
            <div className='flex flex-col gap-2'>
              <Typography className='font-medium'>
                Options — mark the correct answer{form.q_type === 'multiple' ? 's' : ''}
              </Typography>
              {form.options.map((option, index) => (
                <div key={index} className='flex items-center gap-2'>
                  {form.q_type === 'single' ? (
                    <Radio checked={option.qo_is_correct} onChange={() => setOption(index, { qo_is_correct: true })} />
                  ) : (
                    <Checkbox
                      checked={option.qo_is_correct}
                      onChange={e => setOption(index, { qo_is_correct: e.target.checked })}
                    />
                  )}
                  <CustomTextField
                    fullWidth
                    placeholder={`Option ${index + 1}`}
                    value={option.qo_text}
                    onChange={e => setOption(index, { qo_text: e.target.value })}
                  />
                  <IconButton
                    disabled={form.options.length <= 2}
                    onClick={() => setForm({ ...form, options: form.options.filter((_, i) => i !== index) })}
                  >
                    <i className='tabler-x' />
                  </IconButton>
                </div>
              ))}
              <Button
                variant='text'
                className='self-start'
                startIcon={<i className='tabler-plus' />}
                onClick={() => setForm({ ...form, options: [...form.options, { qo_text: '', qo_is_correct: false }] })}
              >
                Add option
              </Button>
            </div>
          )}
          <div className='grid grid-cols-1 sm:grid-cols-4 gap-4'>
            <CustomTextField
              className='sm:col-span-3'
              fullWidth
              label='Explanation (shown after passing)'
              value={form.q_explanation}
              onChange={e => setForm({ ...form, q_explanation: e.target.value })}
            />
            <CustomTextField
              type='number'
              label='Marks'
              value={form.q_marks}
              onChange={e => setForm({ ...form, q_marks: Number(e.target.value) })}
            />
          </div>
        </FormDialog>
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        title='Remove question'
        confirmText='Remove'
        confirmColor='error'
        description='Remove this question from the draft?'
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          try {
            await api.post('/training/question/delete', { q_id: removing?.q_id })
            setRemoving(null)
            onChanged()
          } catch (error) {
            toast.error(errorMessage(error))
          }
        }}
      />
    </Card>
  )
}

export default QuestionsTab
