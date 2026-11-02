// Next Imports
import type { Metadata } from 'next'

// Component Imports
import Notifications from '@views/notifications/Notifications'

export const metadata: Metadata = {
  title: 'Notifications'
}

const NotificationsPage = () => {
  return <Notifications />
}

export default NotificationsPage
