// Next Imports
import type { Metadata } from 'next'

// Component Imports
import UserList from '@views/admin/users/UserList'
import RequirePermission from '@/hocs/RequirePermission'

export const metadata: Metadata = {
  title: 'Users'
}

const Page = () => {
  return (
    <RequirePermission module={'user'}>
      <UserList />
    </RequirePermission>
  )
}

export default Page
