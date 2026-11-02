'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Alert from '@mui/material/Alert'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import FormDialog from '@/components/dialogs/FormDialog'
import CustomTextField from '@core/components/mui/TextField'

// Lib Imports
import { ApiError, api } from '@/libs/api'

// Type Imports
import type { UpdateAction } from './types'

type Props = {
  open: boolean
  mvId: number
  isFirstPublish: boolean
  onClose: () => void
  onPublished: () => void
}

const ACTIONS: { value: UpdateAction; title: string; description: string }[] = [
  {
    value: 'none',
    title: 'Minor update',
    description:
      'Typos or small fixes. Existing completions stay valid; learners who have not started get the new version.'
  },
  {
    value: 'reacknowledge',
    title: 'Fresh acknowledgement',
    description: 'The SOP changed. Everyone who completed the module must review it and acknowledge again.'
  },
  {
    value: 'retrain',
    title: 'Full retraining',
    description:
      'Important change. Everyone who completed the module must redo lessons, assessment and acknowledgement.'
  }
]

const PublishDialog = ({ open, mvId, isFirstPublish, onClose, onPublished }: Props) => {
  // States
  const [action, setAction] = useState<UpdateAction>('none')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  const publish = async () => {
    setErrors([])

    try {
      const res = await api.post<{ moved: number; retrained: number; path_assigned: number }>(
        '/training/version/publish',
        {
          mv_id: mvId,
          update_action: action,
          change_note: note
        }
      )

      const parts = [
        res.data.retrained
          ? `${res.data.retrained} learners must ${action === 'retrain' ? 'retrain' : 're-acknowledge'}`
          : null,
        res.data.path_assigned ? `${res.data.path_assigned} path learners assigned` : null
      ].filter(Boolean)

      toast.success(`Published${parts.length ? ` · ${parts.join(' · ')}` : ''}`)
      onPublished()
    } catch (error) {
      if (error instanceof ApiError && error.data?.errors) {
        setErrors(error.data.errors)

        // Keep the dialog open with the list of issues
        throw new Error(error.message)
      }

      throw error
    }
  }

  return (
    <FormDialog open={open} title='Publish version' submitText='Publish' onClose={onClose} onSubmit={publish}>
      {errors.length > 0 && (
        <Alert severity='error'>
          <ul className='list-disc pis-4'>
            {errors.map(error => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}
      {isFirstPublish ? (
        <Typography color='text.secondary'>
          The module becomes available for assignment. Learners on training paths that include it are assigned
          automatically.
        </Typography>
      ) : (
        <>
          <Typography className='font-medium'>
            What should happen to learners who completed an earlier version?
          </Typography>
          <RadioGroup value={action} onChange={e => setAction(e.target.value as UpdateAction)} className='gap-2'>
            {ACTIONS.map(item => (
              <FormControlLabel
                key={item.value}
                value={item.value}
                control={<Radio />}
                label={
                  <div className='flex flex-col'>
                    <Typography className='font-medium'>{item.title}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {item.description}
                    </Typography>
                  </div>
                }
              />
            ))}
          </RadioGroup>
        </>
      )}
      <CustomTextField
        fullWidth
        label='Change note'
        placeholder='What changed?'
        value={note}
        onChange={e => setNote(e.target.value)}
      />
    </FormDialog>
  )
}

export default PublishDialog
