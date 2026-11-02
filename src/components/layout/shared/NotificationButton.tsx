'use client'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'

// Hook Imports
import { useAuth } from '@/hooks/useAuth'

const NotificationButton = () => {
  // Hooks
  const { profile } = useAuth()

  return (
    <IconButton component={Link} href='/notifications' className='text-textPrimary' aria-label='Notifications'>
      <Badge color='error' badgeContent={profile?.unread_notifications || 0} max={99}>
        <i className='tabler-bell' />
      </Badge>
    </IconButton>
  )
}

export default NotificationButton
