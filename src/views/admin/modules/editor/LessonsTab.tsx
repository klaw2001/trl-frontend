'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import FormDialog from '@/components/dialogs/FormDialog'
import ConfirmDialog from '@/components/dialogs/ConfirmDialog'
import FileUploadButton from '@/components/form/FileUploadButton'
import VideoPicker from '@/components/media/VideoPicker'
import { RichTextEditor } from '@/components/RichText'
import EmptyState from '@/components/EmptyState'
import CustomTextField from '@core/components/mui/TextField'

// Lib Imports
import { api, errorMessage } from '@/libs/api'

// Type Imports
import type { FileRow } from '@/types/apiTypes'
import type { LessonRow, VersionDetail } from './types'

// Util Imports
import { formatDuration, formatFileSize } from '@/utils/format'

type LessonForm = {
  lesson_id?: number
  lesson_title: string
  lesson_content: string | null
  lesson_video_id: number | null
  lesson_is_required: boolean
  lesson_min_watch_percent: number | null
  files: FileRow[]
}

const emptyLesson: LessonForm = {
  lesson_title: '',
  lesson_content: '',
  lesson_video_id: null,
  lesson_is_required: true,
  lesson_min_watch_percent: null,
  files: []
}

type Props = {
  version: VersionDetail
  readOnly: boolean
  onChanged: () => void
}

const LessonsTab = ({ version, readOnly, onChanged }: Props) => {
  // States
  const [form, setForm] = useState<LessonForm | null>(null)
  const [removing, setRemoving] = useState<LessonRow | null>(null)

  const save = async () => {
    if (!form) {
      return
    }

    const { files, ...lesson } = form

    await api.post('/training/lesson/save', {
      ...lesson,
      lesson_version_id: version.mv_id,
      file_ids: files.map(file => file.file_id)
    })
    toast.success('Lesson saved')
    setForm(null)
    onChanged()
  }

  const move = async (index: number, offset: number) => {
    const ids = version.lessons.map(l => l.lesson_id)
    const [moved] = ids.splice(index, 1)

    ids.splice(index + offset, 0, moved)

    try {
      await api.post('/training/reorder', { mv_id: version.mv_id, ids, type: 'lesson' })
      onChanged()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <Card>
      <CardHeader
        title='Lessons'
        subheader='Video lessons complete after the minimum watch time; reading lessons are confirmed by the learner'
        action={
          !readOnly && (
            <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => setForm(emptyLesson)}>
              Add lesson
            </Button>
          )
        }
      />
      {version.lessons.length === 0 && (
        <EmptyState
          icon='tabler-movie'
          title='No lessons yet'
          description='Add at least one lesson before publishing.'
        />
      )}
      <div className='flex flex-col'>
        {version.lessons.map((lesson, index) => (
          <div key={lesson.lesson_id} className='flex flex-wrap items-center gap-4 pli-6 plb-4 border-bs'>
            <Typography className='font-medium min-is-6'>{index + 1}</Typography>
            <i className={`${lesson.lesson_video ? 'tabler-player-play' : 'tabler-file-text'} text-xl text-primary`} />
            <div className='flex flex-col flex-1 min-is-[200px]'>
              <Typography color='text.primary' className='font-medium'>
                {lesson.lesson_title}
              </Typography>
              <div className='flex flex-wrap gap-2 mbs-1'>
                {lesson.lesson_video && (
                  <Chip
                    size='small'
                    variant='tonal'
                    color={lesson.lesson_video.video_state === 'ready' ? 'success' : 'warning'}
                    label={`${lesson.lesson_video.video_title} ${formatDuration(lesson.lesson_video.video_duration_seconds)} · ${lesson.lesson_video.video_state}`}
                  />
                )}
                {lesson.lesson_files.length > 0 && (
                  <Chip size='small' variant='tonal' label={`${lesson.lesson_files.length} files`} />
                )}
                {!lesson.lesson_is_required && <Chip size='small' variant='outlined' label='Optional' />}
                {lesson.lesson_min_watch_percent !== null && (
                  <Chip size='small' variant='outlined' label={`Watch ${lesson.lesson_min_watch_percent}%`} />
                )}
              </div>
            </div>
            {!readOnly && (
              <div className='flex'>
                <IconButton disabled={index === 0} onClick={() => move(index, -1)}>
                  <i className='tabler-arrow-up' />
                </IconButton>
                <IconButton disabled={index === version.lessons.length - 1} onClick={() => move(index, 1)}>
                  <i className='tabler-arrow-down' />
                </IconButton>
                <IconButton
                  onClick={() =>
                    setForm({
                      lesson_id: lesson.lesson_id,
                      lesson_title: lesson.lesson_title,
                      lesson_content: lesson.lesson_content,
                      lesson_video_id: lesson.lesson_video_id,
                      lesson_is_required: lesson.lesson_is_required,
                      lesson_min_watch_percent: lesson.lesson_min_watch_percent,
                      files: lesson.lesson_files.map(lf => lf.lf_file)
                    })
                  }
                >
                  <i className='tabler-edit' />
                </IconButton>
                <IconButton color='error' onClick={() => setRemoving(lesson)}>
                  <i className='tabler-trash' />
                </IconButton>
              </div>
            )}
          </div>
        ))}
      </div>

      {form && (
        <FormDialog
          open
          maxWidth='md'
          title={form.lesson_id ? 'Edit lesson' : 'Add lesson'}
          onClose={() => setForm(null)}
          onSubmit={save}
        >
          <CustomTextField
            fullWidth
            label='Lesson title'
            value={form.lesson_title}
            onChange={e => setForm({ ...form, lesson_title: e.target.value })}
          />
          <VideoPicker
            value={form.lesson_video_id}
            onChange={video => setForm({ ...form, lesson_video_id: video })}
            label='Lesson video (optional)'
          />
          <Typography className='font-medium'>Instructions</Typography>
          <RichTextEditor value={form.lesson_content} onChange={html => setForm({ ...form, lesson_content: html })} />
          <div className='flex flex-col gap-2'>
            <Typography className='font-medium'>Supporting images and PDFs</Typography>
            {form.files.map(file => (
              <div key={file.file_id} className='flex items-center gap-3'>
                <i className={file.file_mime.startsWith('image/') ? 'tabler-photo' : 'tabler-file-type-pdf'} />
                <Typography className='flex-1'>{file.file_name}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {formatFileSize(file.file_size)}
                </Typography>
                <IconButton
                  size='small'
                  onClick={() => setForm({ ...form, files: form.files.filter(f => f.file_id !== file.file_id) })}
                >
                  <i className='tabler-x' />
                </IconButton>
              </div>
            ))}
            <div className='flex flex-wrap gap-2'>
              <FileUploadButton
                type='image'
                onUploaded={file => setForm(prev => prev && { ...prev, files: [...prev.files, file] })}
              />
              <FileUploadButton
                type='document'
                onUploaded={file => setForm(prev => prev && { ...prev, files: [...prev.files, file] })}
              />
            </div>
          </div>
          <div className='flex flex-wrap items-center gap-4'>
            <FormControlLabel
              control={
                <Switch
                  checked={form.lesson_is_required}
                  onChange={e => setForm({ ...form, lesson_is_required: e.target.checked })}
                />
              }
              label='Required'
            />
            {form.lesson_video_id && (
              <CustomTextField
                type='number'
                label='Minimum watched % (override)'
                placeholder={`Module default ${version.mv_min_watch_percent}%`}
                value={form.lesson_min_watch_percent ?? ''}
                onChange={e =>
                  setForm({ ...form, lesson_min_watch_percent: e.target.value ? Number(e.target.value) : null })
                }
              />
            )}
          </div>
        </FormDialog>
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        title='Remove lesson'
        confirmText='Remove'
        confirmColor='error'
        description={`Remove "${removing?.lesson_title}" from this draft?`}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          try {
            await api.post('/training/lesson/delete', { lesson_id: removing?.lesson_id })
            setRemoving(null)
            onChanged()
          } catch (error) {
            toast.error(errorMessage(error))
          }
        }}
      />
    </Card>
  )
}

export default LessonsTab
