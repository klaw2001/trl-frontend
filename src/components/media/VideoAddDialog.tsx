'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'
import * as tus from 'tus-js-client'

// Component Imports
import FormDialog from '@/components/dialogs/FormDialog'
import CustomTextField from '@core/components/mui/TextField'

// Lib Imports
import { api } from '@/libs/api'

// Type Imports
import type { Video } from '@/types/apiTypes'

type UploadCredentials = {
  endpoint: string
  library_id: string
  video_id: string
  expire: number
  signature: string
}

type Props = {
  open: boolean
  onClose: () => void
  onAdded: (video: Video) => void
}

type Mode = 'upload' | 'register' | 'external'

// Upload straight from the browser to Bunny Stream (resumable TUS), or link an existing video
const VideoAddDialog = ({ open, onClose, onAdded }: Props) => {
  // States
  const [mode, setMode] = useState<Mode>('upload')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [value, setValue] = useState('')
  const [progress, setProgress] = useState<number | null>(null)

  const reset = () => {
    setTitle('')
    setFile(null)
    setValue('')
    setProgress(null)
  }

  const close = () => {
    if (progress !== null && progress < 100) {
      return
    }

    reset()
    onClose()
  }

  const uploadToBunny = (selected: File, credentials: UploadCredentials) =>
    new Promise<void>((resolve, reject) => {
      const upload = new tus.Upload(selected, {
        endpoint: credentials.endpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
        chunkSize: 50 * 1024 * 1024,
        headers: {
          AuthorizationSignature: credentials.signature,
          AuthorizationExpire: String(credentials.expire),
          VideoId: credentials.video_id,
          LibraryId: credentials.library_id
        },
        metadata: { filetype: selected.type, title: title || selected.name },
        onProgress: (sent, total) => setProgress(Math.round((sent / total) * 100)),
        onSuccess: () => resolve(),
        onError: error => reject(error)
      })

      upload.findPreviousUploads().then(previous => {
        if (previous.length) {
          upload.resumeFromPreviousUpload(previous[0])
        }

        upload.start()
      })
    })

  const submit = async () => {
    if (mode === 'upload') {
      if (!file) {
        throw new Error('Choose a video file')
      }

      const res = await api.post<{ video: Video; upload: UploadCredentials }>('/media/video/upload', {
        title: title || file.name
      })

      setProgress(0)
      await uploadToBunny(file, res.data.upload)
      toast.success('Uploaded. Bunny is encoding the video; it becomes playable in a few minutes.')
      onAdded({ ...res.data.video, video_state: 'processing' })
    } else if (mode === 'register') {
      const res = await api.post<{ video: Video }>('/media/video/register', { value, title })

      onAdded(res.data.video)
    } else {
      const res = await api.post<{ video: Video }>('/media/video/external', { url: value, title })

      onAdded(res.data.video)
    }

    reset()
    onClose()
  }

  return (
    <FormDialog
      open={open}
      title='Add video'
      onClose={close}
      onSubmit={submit}
      submitText={mode === 'upload' ? 'Upload' : 'Add'}
    >
      <Tabs value={mode} onChange={(_, next) => setMode(next)} variant='scrollable'>
        <Tab value='upload' label='Upload file' />
        <Tab value='register' label='Existing Bunny video' />
        <Tab value='external' label='HLS link' />
      </Tabs>
      <CustomTextField fullWidth label='Title' value={title} onChange={e => setTitle(e.target.value)} />
      {mode === 'upload' && (
        <div className='flex flex-col gap-3'>
          <Button variant='tonal' component='label' startIcon={<i className='tabler-video-plus' />}>
            {file ? file.name : 'Choose video file'}
            <input hidden type='file' accept='video/*' onChange={e => setFile(e.target.files?.[0] || null)} />
          </Button>
          <Typography variant='body2' color='text.secondary'>
            The file goes directly to Bunny Stream with a resumable upload; large files continue after a dropped
            connection.
          </Typography>
          {progress !== null && (
            <div className='flex flex-col gap-1'>
              <LinearProgress variant='determinate' value={progress} />
              <Typography variant='body2'>{progress}% uploaded</Typography>
            </div>
          )}
        </div>
      )}
      {mode === 'register' && (
        <CustomTextField
          fullWidth
          label='Bunny video ID or URL'
          placeholder='e.g. 8f4c…-…-… or https://iframe.mediadelivery.net/play/…'
          value={value}
          onChange={e => setValue(e.target.value)}
        />
      )}
      {mode === 'external' && (
        <>
          <CustomTextField
            fullWidth
            label='HLS (.m3u8) URL'
            placeholder='https://…/playlist.m3u8'
            value={value}
            onChange={e => setValue(e.target.value)}
          />
          <Alert severity='warning'>External links are not token protected. Use Bunny for confidential content.</Alert>
        </>
      )}
    </FormDialog>
  )
}

export default VideoAddDialog
