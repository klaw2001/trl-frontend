'use client'

// MUI Imports
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'

// Hook Imports
import { useAuth } from '@/hooks/useAuth'

// Util Imports
import { formatDateTime, formatTime } from '@/utils/format'

// Shift status for shift restricted roles
const ShiftChip = () => {
  // Hooks
  const { profile } = useAuth()

  const shift = profile?.shift

  if (!shift?.restricted) {
    return null
  }

  return shift.allowed ? (
    <Tooltip title={`Training and recipes are available until ${formatTime(shift.ends_at)}`}>
      <Chip
        size='small'
        variant='tonal'
        color='success'
        icon={<i className='tabler-clock-check' />}
        label={`On shift · until ${formatTime(shift.ends_at)}`}
      />
    </Tooltip>
  ) : (
    <Tooltip title={shift.next_start_at ? `Next shift starts ${formatDateTime(shift.next_start_at)}` : ''}>
      <Chip
        size='small'
        variant='tonal'
        color='warning'
        icon={<i className='tabler-clock-pause' />}
        label='Off shift'
      />
    </Tooltip>
  )
}

export default ShiftChip
