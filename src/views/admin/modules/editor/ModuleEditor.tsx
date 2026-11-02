'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import ConfirmDialog from '@/components/dialogs/ConfirmDialog'
import { ContentStateChip } from '@/components/StatusChip'
import DetailsTab from './DetailsTab'
import LessonsTab from './LessonsTab'
import QuestionsTab from './QuestionsTab'
import VersionsTab from './VersionsTab'
import PreviewTab from './PreviewTab'
import PublishDialog from './PublishDialog'

// Hook Imports
import { useApi } from '@/hooks/useApi'
import { useAuth } from '@/hooks/useAuth'

// Lib Imports
import { api, errorMessage } from '@/libs/api'

// Type Imports
import type { ModuleDetail, VersionDetail } from './types'

type TabValue = 'details' | 'lessons' | 'questions' | 'preview' | 'versions'

const ModuleEditor = ({ id }: { id: string }) => {
  // States
  const [tab, setTab] = useState<TabValue>('details')
  const [viewVersion, setViewVersion] = useState<number | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [confirm, setConfirm] = useState<'discard' | 'archive' | null>(null)

  // Hooks
  const { can } = useAuth()
  const moduleQuery = useApi<ModuleDetail>(`/training/single/${id}`)
  const versionId = viewVersion || moduleQuery.data?.editable_version_id
  const version = useApi<VersionDetail>(versionId ? `/training/version/${versionId}` : null)

  const canWrite = can('training', 'write')

  if (moduleQuery.error) {
    return <Alert severity='error'>{moduleQuery.error.message}</Alert>
  }

  if (!moduleQuery.data || !version.data) {
    return <LinearProgress />
  }

  const data = moduleQuery.data
  const draftId = data.draft_version_id
  const readOnly = !canWrite || version.data.mv_state !== 'draft'
  const title = version.data.mv_title

  const reloadAll = async () => {
    await Promise.all([moduleQuery.reload(), version.reload()])
  }

  const createDraft = async () => {
    try {
      await api.post('/training/version/draft', { tm_id: data.tm_id })
      setViewVersion(null)
      await reloadAll()
      toast.success('Draft created. Edit it and publish when ready.')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <Typography component={Link} href='/admin/modules' color='primary.main' className='flex items-center gap-1'>
            <i className='tabler-chevron-left' /> Training modules
          </Typography>
          <div className='flex flex-wrap items-center gap-3'>
            <Typography variant='h4'>{title}</Typography>
            <ContentStateChip
              published={Boolean(data.tm_current_version_id)}
              draft={Boolean(draftId)}
              archived={data.tm_archived}
            />
          </div>
          <Typography color='text.secondary'>
            {data.tm_code ? `${data.tm_code} · ` : ''}Viewing version {version.data.mv_version_no} (
            {version.data.mv_state})
          </Typography>
        </div>
        {canWrite && (
          <div className='flex flex-wrap gap-2'>
            {viewVersion && (
              <Button variant='tonal' color='secondary' onClick={() => setViewVersion(null)}>
                Back to editable version
              </Button>
            )}
            {!draftId && data.tm_current_version_id && !data.tm_archived && (
              <Button variant='tonal' startIcon={<i className='tabler-pencil' />} onClick={createDraft}>
                Edit content (new draft)
              </Button>
            )}
            {draftId && data.tm_current_version_id && (
              <Button variant='tonal' color='error' onClick={() => setConfirm('discard')}>
                Discard draft
              </Button>
            )}
            <Button variant='tonal' color='secondary' onClick={() => setConfirm('archive')}>
              {data.tm_archived ? 'Restore' : 'Archive'}
            </Button>
            {draftId && !data.tm_archived && (
              <Button
                variant='contained'
                startIcon={<i className='tabler-rocket' />}
                onClick={() => setPublishing(true)}
              >
                Publish
              </Button>
            )}
          </div>
        )}
      </div>

      {readOnly && canWrite && !viewVersion && data.tm_current_version_id && (
        <Alert severity='info'>
          This is the live version. Use “Edit content” to create a draft; learners keep the live version until you
          publish.
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant='scrollable'>
        <Tab value='details' label='Details' />
        <Tab value='lessons' label={`Lessons (${version.data.lessons.length})`} />
        <Tab value='questions' label={`Assessment (${version.data.questions.length})`} />
        <Tab value='preview' label='Preview' />
        <Tab value='versions' label={`Versions (${data.versions.length})`} />
      </Tabs>

      {tab === 'details' && <DetailsTab module={data} version={version.data} readOnly={readOnly} onSaved={reloadAll} />}
      {tab === 'lessons' && <LessonsTab version={version.data} readOnly={readOnly} onChanged={version.reload} />}
      {tab === 'questions' && <QuestionsTab version={version.data} readOnly={readOnly} onChanged={version.reload} />}
      {tab === 'preview' && <PreviewTab version={version.data} />}
      {tab === 'versions' && (
        <VersionsTab
          module={data}
          onView={mv_id => {
            setViewVersion(mv_id === data.editable_version_id ? null : mv_id)
            setTab('preview')
          }}
        />
      )}

      {draftId && (
        <PublishDialog
          open={publishing}
          mvId={draftId}
          isFirstPublish={!data.tm_current_version_id}
          onClose={() => setPublishing(false)}
          onPublished={async () => {
            setPublishing(false)
            setViewVersion(null)
            await reloadAll()
          }}
        />
      )}

      <ConfirmDialog
        open={confirm === 'discard'}
        title='Discard draft'
        confirmText='Discard'
        confirmColor='error'
        description='All unpublished changes in this draft are deleted. The live version is not affected.'
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await api.post('/training/version/discard', { mv_id: draftId })
          setConfirm(null)
          await reloadAll()
        }}
      />
      <ConfirmDialog
        open={confirm === 'archive'}
        title={data.tm_archived ? 'Restore module' : 'Archive module'}
        confirmText={data.tm_archived ? 'Restore' : 'Archive'}
        description={
          data.tm_archived
            ? 'The module can be assigned again and learners see their open assignments.'
            : 'The module can no longer be assigned and disappears from learners’ open training. Completion history is kept.'
        }
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await api.post('/training/archive', { tm_id: data.tm_id, archived: !data.tm_archived })
          setConfirm(null)
          await reloadAll()
        }}
      />
    </div>
  )
}

export default ModuleEditor
