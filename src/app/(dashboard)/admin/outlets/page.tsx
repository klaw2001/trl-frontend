// Next Imports
import type { Metadata } from 'next'

// Component Imports
import OutletList from '@views/admin/outlets/OutletList'
import RequirePermission from '@/hocs/RequirePermission'

export const metadata: Metadata = {
  title: 'Outlets'
}

const Page = () => {
  return (
    <RequirePermission module={'outlet'}>
      <OutletList />
    </RequirePermission>
  )
}

export default Page
