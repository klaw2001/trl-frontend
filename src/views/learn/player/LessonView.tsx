'use client'

// React Imports
import { useCallback, useEffect, useRef, useState } from 'react'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import SecureVideoPlayer from '@/components/security/SecureVideoPlayer'
import type { PlayerEvent } from '@/components/security/SecureVideoPlayer'
import { RichTextView } from '@/components/RichText'

// Lib Imports
import { api, errorMessage } from '@/libs/api'

// Type Imports
import type { VideoPlayback } from '@/types/apiTypes'
import type { LessonDetail } from './types'

type Props = {
  asgId: number
  lesson: LessonDetail
  readOnly: boolean
  onCompleted: () => void
}

const LessonView = ({ asgId, lesson, readOnly, onCompleted }: Props) => {
  // States
  const [playback, setPlayback] = useState<VideoPlayback | null>(null)
  const [playbackError, setPlaybackError] = useState<string | null>(null)
  const [watched, setWatched] = useState(lesson.progress.watched_percent)
  const [completed, setCompleted] = useState(Boolean(lesson.progress.completed_at))
  const [marking, setMarking] = useState(false)

  // Refs
  const completedRef = useRef(completed)

  const loadPlayback = useCallback(async () => {
    try {
      const res = await api.get<VideoPlayback>('/learn/lesson/play', { asg_id: asgId, lesson_id: lesson.lesson_id })

      setPlayback(res.data)
      setPlaybackError(null)

      return res.data
    } catch (error) {
      setPlaybackError(errorMessage(error))

      return null
    }
  }, [asgId, lesson.lesson_id])

  // Reset only when another lesson is opened, so a progress refresh does not restart the video
  useEffect(() => {
    setPlayback(null)
    setWatched(lesson.progress.watched_percent)
    setCompleted(Boolean(lesson.progress.completed_at))
    completedRef.current = Boolean(lesson.progress.completed_at)

    if (lesson.video) {
      loadPlayback()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.lesson_id])

  const onProgress = useCallback(
    async (position: number, duration: number, event: PlayerEvent) => {
      if (readOnly) {
        return
      }

      try {
        const res = await api.post<{ watched_percent: number; completed: boolean }>('/learn/lesson/progress', {
          asg_id: asgId,
          lesson_id: lesson.lesson_id,
          position,
          duration,
          event
        })

        setWatched(res.data.watched_percent)

        if (res.data.completed && !completedRef.current) {
          completedRef.current = true
          setCompleted(true)
          toast.success('Lesson completed')
          onCompleted()
        }
      } catch {
        // Heartbeats are best effort; a lost one only delays the credit
      }
    },
    [asgId, lesson.lesson_id, readOnly, onCompleted]
  )

  const markAsRead = async () => {
    setMarking(true)

    try {
      await api.post('/learn/lesson/complete', { asg_id: asgId, lesson_id: lesson.lesson_id })
      setCompleted(true)
      onCompleted()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setMarking(false)
    }
  }

  const images = lesson.files.filter(file => file.file_mime.startsWith('image/'))
  const documents = lesson.files.filter(file => !file.file_mime.startsWith('image/'))

  return (
    <Card>
      <CardContent className='flex flex-col gap-5'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <Typography variant='h5'>{lesson.lesson_title}</Typography>
          {completed && (
            <Typography color='success.main' className='flex items-center gap-1'>
              <i className='tabler-circle-check' /> Completed
            </Typography>
          )}
        </div>

        {lesson.video &&
          (playback ? (
            <>
              <SecureVideoPlayer
                playback={playback}
                restrictSeeking={!completed}
                onProgress={onProgress}
                onRefresh={loadPlayback}
              />
              {!completed && (
                <div className='flex flex-col gap-1'>
                  <div className='flex justify-between'>
                    <Typography variant='body2'>Watched {watched}%</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Watch at least {lesson.min_watch_percent}% to complete this lesson
                    </Typography>
                  </div>
                  <LinearProgress
                    variant='determinate'
                    value={Math.min(100, (watched / lesson.min_watch_percent) * 100)}
                  />
                </div>
              )}
            </>
          ) : playbackError ? (
            <Alert severity='warning'>{playbackError}</Alert>
          ) : (
            <LinearProgress />
          ))}

        <RichTextView html={lesson.lesson_content} />

        {images.map(file => (
          <img
            key={file.file_id}
            src={file.url}
            alt={file.file_name}
            className='max-is-full rounded border'
            draggable={false}
          />
        ))}

        {documents.map(file => (
          <div key={file.file_id} className='flex flex-col gap-2'>
            <Typography className='font-medium flex items-center gap-2'>
              <i className='tabler-file-type-pdf text-error' /> {file.file_name}
            </Typography>
            <iframe
              title={file.file_name}
              src={`${file.url}#toolbar=0&navpanes=0`}
              className='is-full bs-[70vh] rounded border'
            />
          </div>
        ))}

        {!lesson.video && !completed && !readOnly && (
          <Button variant='contained' className='self-start' onClick={markAsRead} disabled={marking}>
            I have read this lesson
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default LessonView
