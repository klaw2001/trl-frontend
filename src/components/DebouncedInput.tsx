'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import type { TextFieldProps } from '@mui/material/TextField'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

type Props = {
  value: string
  onChange: (value: string) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange' | 'value'>

const DebouncedInput = ({ value: initialValue, onChange, debounce = 400, ...props }: Props) => {
  // States
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (value === initialValue) {
      return
    }

    const timeout = setTimeout(() => onChange(value), debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

export default DebouncedInput
