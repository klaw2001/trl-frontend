'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'

// Component Imports
import FormDialog from '@/components/dialogs/FormDialog'
import SecureVideoPlayer from '@/components/security/SecureVideoPlayer'

// Lib Imports
import { api, errorMessage } from '@/libs/api'

// Type Imports
import type { VideoPlayback } from '@/types/apiTypes'

type Props = {
  videoId: number | null
  onClose: () => void
}

const VideoPreviewDialog = ({ videoId, onClose }: Props) => {
  // States
  const [playback, setPlayback] = useState<VideoPlayback | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPlayback(null)
    setError(null)

    if (videoId) {
      api
        .get<VideoPlayback>(`/media/video/preview/${videoId}`)
        .then(res => setPlayback(res.data))
        .catch(err => setError(errorMessage(err)))
    }
  }, [videoId])

  return (
    <FormDialog open={Boolean(videoId)} title='Video preview' onClose={onClose} maxWidth='md'>
      {error && <Alert severity='error'>{error}</Alert>}
      {!error && !playback && <LinearProgress />}
      {playback && <SecureVideoPlayer playback={playback} />}
    </FormDialog>
  )
}

export default VideoPreviewDialog
