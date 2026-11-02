// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Type Imports
import type { ShiftAccess } from '@/types/apiTypes'

// Util Imports
import { WEEKDAYS, formatDateTime } from '@/utils/format'

// Shown when the API answers OUTSIDE_SHIFT
const ShiftLockCard = ({ shift }: { shift?: ShiftAccess | null }) => {
  const days = shift?.days?.length
    ? shift.days.map(day => WEEKDAYS.find(w => w.value === day)?.label).join(', ')
    : 'Every day'

  return (
    <Card>
      <CardContent className='flex flex-col items-center text-center gap-3 plb-12'>
        <CustomAvatar skin='light' color='warning' size={64}>
          <i className='tabler-clock-pause text-[32px]' />
        </CustomAvatar>
        <Typography variant='h5'>Available during your shift</Typography>
        <Typography color='text.secondary'>
          Training videos, assessments and recipes can only be opened during your working hours.
        </Typography>
        {shift?.start && (
          <Typography>
            Shift: <strong>{shift.start}</strong> – <strong>{shift.end}</strong> ({days})
          </Typography>
        )}
        {shift?.next_start_at && (
          <Typography color='text.secondary'>Next access from {formatDateTime(shift.next_start_at)}</Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default ShiftLockCard
