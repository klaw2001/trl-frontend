'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'

// Component Imports
import ServerTable from '@/components/ServerTable'

// Type Imports
import type { ModuleDetail } from './types'

// Util Imports
import { formatDateTime, fullName } from '@/utils/format'

const STATE_COLOR = { draft: 'info', published: 'success', superseded: 'secondary' } as const

const ACTION_LABEL = { none: 'Minor update', reacknowledge: 'Fresh acknowledgement', retrain: 'Full retraining' }

type Props = {
  module: ModuleDetail
  onView: (mv_id: number) => void
}

// Every published version stays available; completion records stay linked to the version learners completed
const VersionsTab = ({ module, onView }: Props) => {
  return (
    <Card>
      <CardHeader title='Version history' subheader='Completions remain linked to the version each learner completed' />
      <ServerTable
        rows={module.versions}
        rowKey={row => row.mv_id}
        columns={[
          { key: 'version', header: 'Version', render: row => `v${row.mv_version_no}` },
          { key: 'mv_title', header: 'Title' },
          {
            key: 'state',
            header: 'State',
            render: row => <Chip size='small' variant='tonal' label={row.mv_state} color={STATE_COLOR[row.mv_state]} />
          },
          {
            key: 'published',
            header: 'Published',
            render: row =>
              row.mv_published_at ? `${formatDateTime(row.mv_published_at)} · ${fullName(row.mv_published_by)}` : '—'
          },
          {
            key: 'action',
            header: 'Learners',
            render: row => (row.mv_published_at && row.mv_version_no > 1 ? ACTION_LABEL[row.mv_update_action] : '—')
          },
          { key: 'mv_change_note', header: 'Change note' },
          {
            key: 'content',
            header: 'Content',
            render: row => `${row._count.lessons} lessons · ${row._count.questions} questions`
          },
          { key: 'assignments', header: 'Assignments', render: row => row._count.assignments },
          {
            key: 'view',
            header: '',
            align: 'right',
            render: row => (
              <Button size='small' variant='tonal' onClick={() => onView(row.mv_id)}>
                View
              </Button>
            )
          }
        ]}
      />
    </Card>
  )
}

export default VersionsTab
