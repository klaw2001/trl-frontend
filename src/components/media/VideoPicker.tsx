'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'

// Component Imports
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import CustomTextField from '@core/components/mui/TextField'
import VideoAddDialog from './VideoAddDialog'
import VideoPreviewDialog from './VideoPreviewDialog'

// Lib Imports
import { api } from '@/libs/api'

// Type Imports
import type { Paged, Video } from '@/types/apiTypes'

// Util Imports
import { formatDuration } from '@/utils/format'

type Props = {
  value: number | null
  onChange: (videoId: number | null) => void
  label?: string
}

const stateColor = { ready: 'success', processing: 'info', uploading: 'warning', failed: 'error' } as const

const VideoPicker = ({ value, onChange, label = 'Video' }: Props) => {
  // States
  const [videos, setVideos] = useState<Video[]>([])
  const [adding, setAdding] = useState(false)
  const [preview, setPreview] = useState<number | null>(null)

  useEffect(() => {
    api.get<Paged<Video>>('/media/video/all', { limit: 500 }).then(res => setVideos(res.data.rows))
  }, [])

  const selected = videos.find(video => video.video_id === value) || null

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-wrap items-end gap-2'>
        <CustomAutocomplete
          className='flex-1 min-is-[240px]'
          options={videos}
          value={selected}
          getOptionLabel={video =>
            `${video.video_title}${video.video_duration_seconds ? ` (${formatDuration(video.video_duration_seconds)})` : ''}`
          }
          isOptionEqualToValue={(option, item) => option.video_id === item.video_id}
          onChange={(_, video) => onChange(video?.video_id ?? null)}
          renderInput={params => <CustomTextField {...params} label={label} placeholder='No video' />}
        />
        <Button variant='tonal' onClick={() => setAdding(true)} startIcon={<i className='tabler-plus' />}>
          New video
        </Button>
        {selected && (
          <Button
            variant='tonal'
            color='secondary'
            onClick={() => setPreview(selected.video_id)}
            startIcon={<i className='tabler-eye' />}
          >
            Preview
          </Button>
        )}
      </div>
      {selected && (
        <Chip
          size='small'
          variant='tonal'
          className='self-start'
          color={stateColor[selected.video_state]}
          label={`${selected.video_source === 'bunny' ? 'Bunny Stream' : 'External link'} · ${selected.video_state}`}
        />
      )}
      <VideoAddDialog
        open={adding}
        onClose={() => setAdding(false)}
        onAdded={video => {
          setVideos(prev => [video, ...prev])
          onChange(video.video_id)
        }}
      />
      <VideoPreviewDialog videoId={preview} onClose={() => setPreview(null)} />
    </div>
  )
}

export default VideoPicker
