'use client'

// MUI Imports
import MenuItem from '@mui/material/MenuItem'
import type { TextFieldProps } from '@mui/material/TextField'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// Type Imports
import type { Option } from '@/types/apiTypes'

type Props = Omit<TextFieldProps, 'onChange' | 'value'> & {
  options: Option[]
  value: string | number | null | undefined
  onChange: (value: any) => void
  emptyLabel?: string
}

// Single select; the empty option maps to null
const SelectField = ({ options, value, onChange, emptyLabel, slotProps, ...props }: Props) => {
  return (
    <CustomTextField
      select
      fullWidth
      {...props}
      slotProps={{
        ...slotProps,
        select: { displayEmpty: emptyLabel !== undefined, ...(slotProps?.select as object) }
      }}
      value={value ?? ''}
      onChange={e => {
        const raw = e.target.value
        const match = options.find(o => String(o.value) === String(raw))

        onChange(raw === '' ? null : (match?.value ?? raw))
      }}
    >
      {emptyLabel !== undefined && (
        <MenuItem value=''>
          <em>{emptyLabel}</em>
        </MenuItem>
      )}
      {options.map(option => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </CustomTextField>
  )
}

export default SelectField
