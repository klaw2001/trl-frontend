// Next Imports
import type { Metadata } from 'next'

// Component Imports
import PathList from '@views/admin/paths/PathList'
import RequirePermission from '@/hocs/RequirePermission'

export const metadata: Metadata = {
  title: 'Training Paths'
}

const Page = () => {
  return (
    <RequirePermission module={'path'}>
      <PathList />
    </RequirePermission>
  )
}

export default Page
