'use client'

// React Imports
import { useCallback, useEffect, useRef, useState } from 'react'

// MUI Imports
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

// Third-party Imports
import Hls, { Events } from 'hls.js'

// Component Imports
import Watermark from './Watermark'

// Type Imports
import type { VideoPlayback } from '@/types/apiTypes'

export type PlayerEvent = 'play' | 'heartbeat' | 'pause' | 'ended'

type Props = {
  playback: VideoPlayback

  // Learners cannot seek past the furthest point they have watched
  restrictSeeking?: boolean
  onProgress?: (position: number, duration: number, event: PlayerEvent) => void

  // Called when the signed URL expired; should return a fresh playback object
  onRefresh?: () => Promise<VideoPlayback | null>
}

const MAX_RATE = 2

const SecureVideoPlayer = ({ playback, restrictSeeking = false, onProgress, onRefresh }: Props) => {
  // States
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState(playback)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const maxReached = useRef(playback.max_position || 0)
  const resumeAt = useRef(playback.resume_position || 0)
  const progressRef = useRef(onProgress)

  progressRef.current = onProgress

  const report = useCallback((event: PlayerEvent) => {
    const video = videoRef.current

    if (video && video.duration) {
      progressRef.current?.(video.currentTime, video.duration, event)
    }
  }, [])

  // Attach the HLS stream (hls.js, or native HLS on Safari / iOS)
  useEffect(() => {
    const video = videoRef.current

    if (!video || !source.url) {
      return
    }

    setError(null)

    const restore = () => {
      if (resumeAt.current > 0 && resumeAt.current < video.duration - 2) {
        video.currentTime = resumeAt.current
      }
    }

    video.addEventListener('loadedmetadata', restore, { once: true })

    // eslint-disable-next-line import/no-named-as-default-member
    if (Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 20, capLevelToPlayerSize: true })

      hlsRef.current = hls
      hls.loadSource(source.url)
      hls.attachMedia(video)
      hls.on(Events.ERROR, async (_, data) => {
        if (!data.fatal) {
          return
        }

        // 403 = signed URL expired; fetch a new one and continue from the same point
        if (data.response?.code === 403 && onRefresh) {
          resumeAt.current = video.currentTime
          const fresh = await onRefresh()

          if (fresh?.url) {
            setSource(fresh)

            return
          }
        }

        setError('Video could not be loaded. Check your connection and try again.')
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source.url
    } else {
      setError('This browser cannot play the training video.')
    }

    return () => {
      video.removeEventListener('loadedmetadata', restore)
      hlsRef.current?.destroy()
      hlsRef.current = null
    }
  }, [source.url, onRefresh])

  // Heartbeats while playing
  useEffect(() => {
    const video = videoRef.current
    const seconds = playback.heartbeat_seconds || 10

    if (!video || !onProgress) {
      return
    }

    let timer: ReturnType<typeof setInterval> | null = null

    const onPlay = () => {
      report('play')
      timer = setInterval(() => report('heartbeat'), seconds * 1000)
    }

    const onStop = (event: PlayerEvent) => () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }

      report(event)
    }

    const onPause = onStop('pause')
    const onEnded = onStop('ended')

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)

    return () => {
      if (timer) {
        clearInterval(timer)
      }

      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
    }
  }, [playback.heartbeat_seconds, onProgress, report])

  // Seeking limit, playback rate cap, pause when the tab is hidden
  useEffect(() => {
    const video = videoRef.current

    if (!video) {
      return
    }

    const onTime = () => {
      if (!video.seeking && video.currentTime > maxReached.current && video.currentTime - maxReached.current < 3) {
        maxReached.current = video.currentTime
      }
    }

    const onSeeking = () => {
      if (restrictSeeking && video.currentTime > maxReached.current + 1) {
        video.currentTime = maxReached.current
      }
    }

    const onRate = () => {
      if (video.playbackRate > MAX_RATE) {
        video.playbackRate = MAX_RATE
      }
    }

    const onVisibility = () => {
      if (document.hidden) {
        video.pause()
      }
    }

    video.addEventListener('timeupdate', onTime)
    video.addEventListener('seeking', onSeeking)
    video.addEventListener('ratechange', onRate)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('seeking', onSeeking)
      video.removeEventListener('ratechange', onRate)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [restrictSeeking])

  // Fullscreen on the container keeps the watermark visible
  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current?.requestFullscreen?.()
    }
  }

  if (!source.url) {
    return (
      <div className='flex items-center justify-center aspect-video rounded bg-black/90'>
        <Typography className='text-white/80'>
          {source.state === 'ready' ? 'Video is not available' : `Video is ${source.state}. Please check back later.`}
        </Typography>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className='protected-content relative aspect-video rounded overflow-hidden bg-black'
      onContextMenu={e => e.preventDefault()}
    >
      <video
        ref={videoRef}
        className='is-full bs-full'
        controls
        playsInline
        preload='metadata'
        disablePictureInPicture
        disableRemotePlayback
        controlsList='nodownload nofullscreen noremoteplayback'
        poster={source.thumbnail || undefined}
      />
      {source.watermark && <Watermark moving text={`${source.watermark.name} · ${source.watermark.employee_id}`} />}
      <IconButton
        size='small'
        onClick={toggleFullscreen}
        className='absolute block-start-2 inline-end-2 z-[4] bg-black/40 text-white hover:bg-black/60'
        aria-label='Fullscreen'
      >
        <i className='tabler-maximize' />
      </IconButton>
      {error && (
        <div className='absolute inset-0 z-[5] flex items-center justify-center bg-black/80 p-6 text-center'>
          <Typography className='text-white'>{error}</Typography>
        </div>
      )}
    </div>
  )
}

export default SecureVideoPlayer
