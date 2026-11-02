'use client'

// React Imports
import { useState } from 'react'
import type { ReactNode } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import type { DialogProps } from '@mui/material/Dialog'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import DialogCloseButton from './DialogCloseButton'

// Lib Imports
import { errorMessage } from '@/libs/api'

type Props = {
  open: boolean
  title: ReactNode
  children: ReactNode
  onClose: () => void

  // Throw to keep the dialog open; the error message is shown as a toast
  onSubmit?: () => Promise<void> | void
  submitText?: string
  maxWidth?: DialogProps['maxWidth']
  disabled?: boolean
  extraActions?: ReactNode
}

const FormDialog = (props: Props) => {
  const {
    open,
    title,
    children,
    onClose,
    onSubmit,
    submitText = 'Save',
    maxWidth = 'sm',
    disabled,
    extraActions
  } = props

  // States
  const [busy, setBusy] = useState(false)

  const handleSubmit = async () => {
    if (!onSubmit) {
      return
    }

    setBusy(true)

    try {
      await onSubmit()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      maxWidth={maxWidth}
      fullWidth
      scroll='body'
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <DialogCloseButton onClick={onClose} disableRipple disabled={busy}>
        <i className='tabler-x' />
      </DialogCloseButton>
      <DialogTitle>{title}</DialogTitle>
      <form
        onSubmit={e => {
          e.preventDefault()
          handleSubmit()
        }}
      >
        <DialogContent className='flex flex-col gap-5 pbs-2'>{children}</DialogContent>
        <DialogActions>
          {extraActions}
          <Button variant='tonal' color='secondary' onClick={onClose} disabled={busy}>
            {onSubmit ? 'Cancel' : 'Close'}
          </Button>
          {onSubmit && (
            <Button variant='contained' type='submit' disabled={busy || disabled}>
              {submitText}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default FormDialog
