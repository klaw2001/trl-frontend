'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

type Props = {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

// Free text list (equipment, quality checkpoints, common mistakes)
const StringListField = ({ label, value, onChange, placeholder }: Props) => {
  // States
  const [draft, setDraft] = useState('')

  const add = () => {
    const text = draft.trim()

    if (text && !value.includes(text)) {
      onChange([...value, text])
    }

    setDraft('')
  }

  return (
    <div className='flex flex-col gap-2'>
      <CustomTextField
        fullWidth
        label={label}
        placeholder={placeholder || 'Type and press Enter'}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            add()
          }
        }}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position='end'>
                <IconButton size='small' onClick={add} disabled={!draft.trim()}>
                  <i className='tabler-plus' />
                </IconButton>
              </InputAdornment>
            )
          }
        }}
      />
      {value.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {value.map(item => (
            <Chip key={item} label={item} onDelete={() => onChange(value.filter(v => v !== item))} />
          ))}
        </div>
      )}
    </div>
  )
}

export default StringListField
