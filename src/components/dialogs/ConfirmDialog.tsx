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
import Typography from '@mui/material/Typography'
import type { ButtonProps } from '@mui/material/Button'

type Props = {
  open: boolean
  title: string
  description?: ReactNode
  confirmText?: string
  confirmColor?: ButtonProps['color']
  children?: ReactNode
  onClose: () => void
  onConfirm: () => Promise<void> | void
}

const ConfirmDialog = (props: Props) => {
  const {
    open,
    title,
    description,
    confirmText = 'Confirm',
    confirmColor = 'primary',
    children,
    onClose,
    onConfirm
  } = props

  // States
  const [busy, setBusy] = useState(false)

  const handleConfirm = async () => {
    setBusy(true)

    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth='xs' fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent className='flex flex-col gap-4'>
        {description && <Typography color='text.secondary'>{description}</Typography>}
        {children}
      </DialogContent>
      <DialogActions>
        <Button variant='tonal' color='secondary' onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant='contained' color={confirmColor} onClick={handleConfirm} disabled={busy}>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmDialog
