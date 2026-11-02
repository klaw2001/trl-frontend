'use client'

// MUI Imports
import Chip from '@mui/material/Chip'

// Component Imports
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import CustomTextField from '@core/components/mui/TextField'

// Type Imports
import type { Option } from '@/types/apiTypes'

type Props = {
  label: string
  options: Option[]
  value: (number | string)[]
  onChange: (value: any[]) => void
  placeholder?: string
  helperText?: string
}

const MultiSelectField = ({ label, options, value, onChange, placeholder, helperText }: Props) => {
  const selected = options.filter(option => value.includes(option.value))

  return (
    <CustomAutocomplete
      multiple
      options={options}
      value={selected}
      getOptionLabel={option => option.label}
      isOptionEqualToValue={(option, item) => option.value === item.value}
      onChange={(_, items) => onChange(items.map(item => item.value))}
      renderValue={(items, getItemProps) =>
        items.map((item, index) => {
          const { key, ...itemProps } = getItemProps({ index })

          return <Chip key={key} size='small' label={item.label} {...itemProps} />
        })
      }
      renderInput={params => (
        <CustomTextField
          {...params}
          label={label}
          placeholder={selected.length ? '' : placeholder}
          helperText={helperText}
        />
      )}
    />
  )
}

export default MultiSelectField
