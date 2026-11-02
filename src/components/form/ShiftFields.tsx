'use client'

// MUI Imports
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Util Imports
import { WEEKDAYS } from '@/utils/format'

type Props = {
  start: string | null
  end: string | null
  days: number[]
  onChange: (value: { start: string | null; end: string | null; days: number[] }) => void
  helperText?: string
}

// Shift window: start / end time (overnight allowed) and working days (none selected = every day)
const ShiftFields = ({ start, end, days, onChange, helperText }: Props) => {
  const toggleDay = (day: number) =>
    onChange({ start, end, days: days.includes(day) ? days.filter(d => d !== day) : [...days, day].sort() })

  return (
    <div className='flex flex-col gap-3'>
      <div className='grid grid-cols-2 gap-4'>
        <CustomTextField
          type='time'
          label='Shift start'
          value={start || ''}
          onChange={e => onChange({ start: e.target.value || null, end, days })}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <CustomTextField
          type='time'
          label='Shift end'
          value={end || ''}
          onChange={e => onChange({ start, end: e.target.value || null, days })}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </div>
      <div className='flex flex-wrap gap-2'>
        {WEEKDAYS.map(day => (
          <Chip
            key={day.value}
            label={day.label}
            size='small'
            color={days.includes(day.value) ? 'primary' : 'default'}
            variant={days.includes(day.value) ? 'filled' : 'outlined'}
            onClick={() => toggleDay(day.value)}
          />
        ))}
      </div>
      <Typography variant='body2' color='text.secondary'>
        {helperText || 'No days selected means every day. An end time before the start time is an overnight shift.'}
      </Typography>
    </div>
  )
}

export default ShiftFields
