// Next Imports
import type { Metadata } from 'next'

// Component Imports
import ModuleList from '@views/admin/modules/ModuleList'
import RequirePermission from '@/hocs/RequirePermission'

export const metadata: Metadata = {
  title: 'Training Modules'
}

const Page = () => {
  return (
    <RequirePermission module={'training'}>
      <ModuleList />
    </RequirePermission>
  )
}

export default Page
