'use client'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import CustomAvatar from '@core/components/mui/Avatar'

// Hook Imports
import { useServerTable } from '@/hooks/useServerTable'
import { useAuth } from '@/hooks/useAuth'

// Lib Imports
import { api } from '@/libs/api'

// Type Imports
import type { ThemeColor } from '@core/types'

// Util Imports
import { formatDateTime } from '@/utils/format'

type Notification = {
  ntf_id: number
  ntf_type: string
  ntf_title: string
  ntf_message: string
  ntf_link: string | null
  ntf_read_at: string | null
  ntf_created_at: string
}

const TYPES: Record<string, { icon: string; color: ThemeColor }> = {
  new_training: { icon: 'tabler-school', color: 'primary' },
  deadline_reminder: { icon: 'tabler-clock', color: 'info' },
  overdue: { icon: 'tabler-alarm', color: 'warning' },
  retraining: { icon: 'tabler-refresh-alert', color: 'error' },
  account: { icon: 'tabler-user', color: 'success' },
  general: { icon: 'tabler-bell', color: 'secondary' }
}

const Notifications = () => {
  // Hooks
  const { rows, reload, tableProps } = useServerTable<Notification>('/notification/all', {}, 20)
  const { refreshProfile } = useAuth()

  const markRead = async (body: object) => {
    await api.post('/notification/read', body)
    await Promise.all([reload(), refreshProfile()])
  }

  return (
    <>
      <PageHeader
        title='Notifications'
        actions={
          <Button variant='tonal' onClick={() => markRead({ all: true })} startIcon={<i className='tabler-checks' />}>
            Mark all as read
          </Button>
        }
      />
      <Card>
        {rows.length === 0 && !tableProps.loading ? (
          <EmptyState icon='tabler-bell-off' title='No notifications' />
        ) : (
          rows.map((item, index) => {
            const type = TYPES[item.ntf_type] || TYPES.general

            return (
              <div key={item.ntf_id}>
                {index > 0 && <Divider />}
                <div
                  className={classnames('flex gap-4 p-5', { 'bg-actionHover': !item.ntf_read_at })}
                  onClick={() => !item.ntf_read_at && markRead({ ntf_ids: [item.ntf_id] })}
                >
                  <CustomAvatar skin='light' color={type.color}>
                    <i className={type.icon} />
                  </CustomAvatar>
                  <div className='flex flex-col gap-1 flex-1'>
                    <div className='flex flex-wrap justify-between gap-2'>
                      <Typography className={classnames({ 'font-medium': !item.ntf_read_at })} color='text.primary'>
                        {item.ntf_title}
                      </Typography>
                      <Typography variant='body2' color='text.disabled'>
                        {formatDateTime(item.ntf_created_at)}
                      </Typography>
                    </div>
                    <Typography color='text.secondary'>{item.ntf_message}</Typography>
                    {item.ntf_link && (
                      <Typography component={Link} href={item.ntf_link} color='primary.main' variant='body2'>
                        Open
                      </Typography>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <TablePagination
          component='div'
          className='border-bs'
          count={tableProps.total}
          page={tableProps.page}
          rowsPerPage={tableProps.pageSize}
          rowsPerPageOptions={[20, 50]}
          onPageChange={(_, page) => tableProps.onPageChange(page)}
          onRowsPerPageChange={e => tableProps.onPageSizeChange(Number(e.target.value))}
        />
      </Card>
    </>
  )
}

export default Notifications
