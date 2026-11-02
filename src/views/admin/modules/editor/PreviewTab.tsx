'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Component Imports
import { RichTextView } from '@/components/RichText'
import VideoPreviewDialog from '@/components/media/VideoPreviewDialog'

// Type Imports
import type { VersionDetail } from './types'

// Learner view of a version, with the correct answers visible
const PreviewTab = ({ version }: { version: VersionDetail }) => {
  // States
  const [videoId, setVideoId] = useState<number | null>(null)

  return (
    <div className='flex flex-col gap-6'>
      <Alert severity='info'>
        Preview of version {version.mv_version_no} ({version.mv_state}). Learners see lessons in this order, then the
        assessment
        {version.mv_requires_ack ? ' and the acknowledgement' : ''}.
      </Alert>
      <Card>
        <CardContent className='flex flex-col gap-2'>
          <Typography variant='h4'>{version.mv_title}</Typography>
          {version.mv_description && <Typography color='text.secondary'>{version.mv_description}</Typography>}
        </CardContent>
      </Card>
      {version.lessons.map((lesson, index) => (
        <Card key={lesson.lesson_id}>
          <CardContent className='flex flex-col gap-4'>
            <Typography variant='h5'>
              {index + 1}. {lesson.lesson_title}
            </Typography>
            {lesson.lesson_video && (
              <Button
                variant='tonal'
                className='self-start'
                startIcon={<i className='tabler-player-play' />}
                onClick={() => setVideoId(lesson.lesson_video!.video_id)}
              >
                Play “{lesson.lesson_video.video_title}”
              </Button>
            )}
            <RichTextView html={lesson.lesson_content} />
            {lesson.lesson_files.map(lf =>
              lf.lf_file.file_mime.startsWith('image/') ? (
                <img
                  key={lf.lf_id}
                  src={lf.url}
                  alt={lf.lf_file.file_name}
                  className='max-is-full max-bs-[360px] rounded border self-start'
                />
              ) : (
                <Button
                  key={lf.lf_id}
                  variant='text'
                  className='self-start'
                  href={lf.url}
                  target='_blank'
                  startIcon={<i className='tabler-file-type-pdf' />}
                >
                  {lf.lf_file.file_name}
                </Button>
              )
            )}
          </CardContent>
        </Card>
      ))}
      {version.questions.length > 0 && (
        <Card>
          <CardContent className='flex flex-col gap-4'>
            <Typography variant='h5'>Assessment · pass mark {version.mv_pass_mark}%</Typography>
            {version.questions.map((question, index) => (
              <div key={question.q_id} className='flex flex-col gap-1'>
                <Typography className='font-medium'>
                  {index + 1}. {question.q_text}
                </Typography>
                {question.q_type === 'written' ? (
                  <Typography color='text.secondary'>Written answer (recorded, not scored)</Typography>
                ) : (
                  question.options.map(option => (
                    <Typography
                      key={option.qo_id}
                      color={option.qo_is_correct ? 'success.main' : 'text.secondary'}
                      className='flex items-center gap-2'
                    >
                      <i className={option.qo_is_correct ? 'tabler-circle-check' : 'tabler-circle'} /> {option.qo_text}
                    </Typography>
                  ))
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {version.mv_requires_ack && (
        <Card>
          <CardContent className='flex flex-col gap-3'>
            <Typography variant='h5'>Acknowledgement</Typography>
            <RichTextView html={version.mv_instructions} />
            <Typography className='flex items-center gap-2'>
              <i className='tabler-square-check' /> {version.mv_ack_text}
            </Typography>
          </CardContent>
        </Card>
      )}
      <VideoPreviewDialog videoId={videoId} onClose={() => setVideoId(null)} />
    </div>
  )
}

export default PreviewTab
