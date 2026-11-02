// Next Imports
import type { Metadata } from 'next'

// Component Imports
import RoleList from '@views/admin/roles/RoleList'
import RequirePermission from '@/hocs/RequirePermission'

export const metadata: Metadata = {
  title: 'Roles & Permissions'
}

const Page = () => {
  return (
    <RequirePermission module={'role'}>
      <RoleList />
    </RequirePermission>
  )
}

export default Page
