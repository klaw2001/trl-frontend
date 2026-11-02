// Next Imports
import type { Metadata } from 'next'

// Component Imports
import Profile from '@views/profile/Profile'

export const metadata: Metadata = {
  title: 'My Profile'
}

const ProfilePage = () => {
  return <Profile />
}

export default ProfilePage
