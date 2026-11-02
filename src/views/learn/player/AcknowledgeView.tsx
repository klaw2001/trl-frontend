'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import { RichTextView } from '@/components/RichText'

// Lib Imports
import { api, errorMessage } from '@/libs/api'

// Type Imports
import type { AssignmentDetail } from './types'

// Util Imports
import { formatDateTime } from '@/utils/format'

type Props = {
  detail: AssignmentDetail
  onAcknowledged: () => void
}

const AcknowledgeView = ({ detail, onAcknowledged }: Props) => {
  // States
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)

  const { assignment, version, steps } = detail

  const acknowledge = async () => {
    setBusy(true)

    try {
      await api.post('/learn/acknowledge', { asg_id: assignment.asg_id })
      toast.success('SOP acknowledged')
      onAcknowledged()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardContent className='flex flex-col gap-5'>
        <Typography variant='h5'>SOP acknowledgement</Typography>
        {version.mv_instructions && (
          <RichTextView html={version.mv_instructions} className='p-4 rounded bg-actionHover' />
        )}
        {assignment.asg_acknowledged_at ? (
          <Alert severity='success'>
            You acknowledged this SOP on {formatDateTime(assignment.asg_acknowledged_at)}: “{version.mv_ack_text}”
          </Alert>
        ) : !steps.all_lessons_done || !steps.assessment_done ? (
          <Alert severity='info'>Complete the lessons and pass the assessment before acknowledging.</Alert>
        ) : (
          <>
            <FormControlLabel
              control={<Checkbox checked={accepted} onChange={e => setAccepted(e.target.checked)} />}
              label={version.mv_ack_text}
            />
            <Button variant='contained' className='self-start' disabled={!accepted || busy} onClick={acknowledge}>
              Acknowledge and complete
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default AcknowledgeView
