'use client'

// React Imports
import { useRef, useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import type { ButtonProps } from '@mui/material/Button'

// Third-party Imports
import { toast } from 'react-toastify'

// Lib Imports
import { api, errorMessage } from '@/libs/api'

// Type Imports
import type { FileRow } from '@/types/apiTypes'

type Props = {
  type: 'image' | 'document'
  label?: string
  onUploaded: (file: FileRow, url: string) => void
  buttonProps?: ButtonProps
}

const ACCEPT = { image: 'image/jpeg,image/png,image/webp', document: 'application/pdf' }

// Uploads an image or PDF to /media/file/upload
const FileUploadButton = ({ type, label, onUploaded, buttonProps }: Props) => {
  // States
  const [uploading, setUploading] = useState(false)

  // Refs
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    const form = new FormData()

    form.append('file', file)
    form.append('type', type)
    setUploading(true)

    try {
      const res = await api.upload<{ file: FileRow; url: string }>('/media/file/upload', form)

      onUploaded(res.data.file, res.data.url)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setUploading(false)

      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type='file'
        hidden
        accept={ACCEPT[type]}
        onChange={e => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <Button
        variant='tonal'
        startIcon={<i className={type === 'image' ? 'tabler-photo-up' : 'tabler-file-upload'} />}
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        {...buttonProps}
      >
        {uploading ? 'Uploading…' : label || (type === 'image' ? 'Upload image' : 'Upload PDF')}
      </Button>
    </>
  )
}

export default FileUploadButton
