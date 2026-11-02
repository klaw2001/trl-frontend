// MUI Imports
import Chip from '@mui/material/Chip'
import type { ChipProps } from '@mui/material/Chip'

// Type Imports
import type { AssignmentState } from '@/types/apiTypes'

const ASSIGNMENT: Record<AssignmentState | 'overdue', { label: string; color: ChipProps['color'] }> = {
  assigned: { label: 'Not started', color: 'secondary' },
  in_progress: { label: 'In progress', color: 'info' },
  completed: { label: 'Completed', color: 'success' },
  failed: { label: 'Retraining needed', color: 'error' },
  revoked: { label: 'Revoked', color: 'default' },
  overdue: { label: 'Overdue', color: 'warning' }
}

export const AssignmentChip = ({ state, overdue }: { state: AssignmentState; overdue?: boolean }) => {
  const config = overdue && state !== 'completed' ? ASSIGNMENT.overdue : ASSIGNMENT[state]

  return <Chip size='small' variant='tonal' label={config.label} color={config.color} />
}

export const BooleanChip = ({
  value,
  trueLabel = 'Active',
  falseLabel = 'Inactive'
}: {
  value: boolean
  trueLabel?: string
  falseLabel?: string
}) => (
  <Chip size='small' variant='tonal' label={value ? trueLabel : falseLabel} color={value ? 'success' : 'secondary'} />
)

export const ContentStateChip = ({
  published,
  archived,
  draft
}: {
  published: boolean
  archived?: boolean
  draft?: boolean
}) => {
  if (archived) {
    return <Chip size='small' variant='tonal' label='Archived' color='secondary' />
  }

  if (published && draft) {
    return <Chip size='small' variant='tonal' label='Published · draft changes' color='warning' />
  }

  return (
    <Chip
      size='small'
      variant='tonal'
      label={published ? 'Published' : 'Draft'}
      color={published ? 'success' : 'info'}
    />
  )
}
