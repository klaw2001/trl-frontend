'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import PageHeader from '@/components/PageHeader'
import ServerTable from '@/components/ServerTable'
import DebouncedInput from '@/components/DebouncedInput'
import VideoAddDialog from '@/components/media/VideoAddDialog'
import VideoPreviewDialog from '@/components/media/VideoPreviewDialog'

// Hook Imports
import { useServerTable } from '@/hooks/useServerTable'

// Lib Imports
import { api, errorMessage } from '@/libs/api'

// Type Imports
import type { Video } from '@/types/apiTypes'

// Util Imports
import { formatDateTime, formatDuration } from '@/utils/format'

type VideoRow = Video & { _count: { lessons: number; recipes: number } }

const stateColor = { ready: 'success', processing: 'info', uploading: 'warning', failed: 'error' } as const

const VideoLibrary = () => {
  // States
  const [adding, setAdding] = useState(false)
  const [preview, setPreview] = useState<number | null>(null)

  // Hooks
  const { rows, filters, setFilter, reload, tableProps } = useServerTable<VideoRow>(
    '/media/video/all',
    { search: '' },
    25
  )

  const refresh = async (video_id: number) => {
    try {
      await api.get(`/media/video/status/${video_id}`)
      reload()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <>
      <PageHeader
        title='Video Library'
        subtitle='Videos stream from Bunny with signed, expiring links. Downloads are disabled.'
        actions={
          <Button variant='contained' startIcon={<i className='tabler-video-plus' />} onClick={() => setAdding(true)}>
            Add video
          </Button>
        }
      />
      <Card>
        <CardContent>
          <DebouncedInput
            value={filters.search}
            onChange={value => setFilter('search', value)}
            placeholder='Search videos'
            className='max-is-[320px]'
          />
        </CardContent>
        <ServerTable
          {...tableProps}
          rows={rows}
          rowKey={row => row.video_id}
          columns={[
            {
              key: 'title',
              header: 'Video',
              render: row => (
                <div className='flex flex-col'>
                  <Typography color='text.primary' className='font-medium'>
                    {row.video_title}
                  </Typography>
                  <Typography variant='body2'>
                    {row.video_source === 'bunny' ? row.video_guid : 'External HLS link'}
                  </Typography>
                </div>
              )
            },
            { key: 'duration', header: 'Length', render: row => formatDuration(row.video_duration_seconds) || '—' },
            {
              key: 'state',
              header: 'State',
              render: row => (
                <Chip size='small' variant='tonal' label={row.video_state} color={stateColor[row.video_state]} />
              )
            },
            {
              key: 'used',
              header: 'Used in',
              render: row => `${row._count.lessons} lessons · ${row._count.recipes} recipes`
            },
            { key: 'created', header: 'Added', render: row => formatDateTime(row.video_created_at) },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: row => (
                <div className='flex justify-end'>
                  {row.video_source === 'bunny' && row.video_state !== 'ready' && (
                    <Tooltip title='Check encoding status'>
                      <IconButton onClick={() => refresh(row.video_id)}>
                        <i className='tabler-refresh' />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title='Preview'>
                    <IconButton onClick={() => setPreview(row.video_id)}>
                      <i className='tabler-player-play' />
                    </IconButton>
                  </Tooltip>
                </div>
              )
            }
          ]}
        />
      </Card>
      <VideoAddDialog open={adding} onClose={() => setAdding(false)} onAdded={() => reload()} />
      <VideoPreviewDialog videoId={preview} onClose={() => setPreview(null)} />
    </>
  )
}

export default VideoLibrary
