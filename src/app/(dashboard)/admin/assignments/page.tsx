// Next Imports
import type { Metadata } from 'next'

// Component Imports
import AssignmentList from '@views/admin/assignments/AssignmentList'
import RequirePermission from '@/hocs/RequirePermission'

export const metadata: Metadata = {
  title: 'Assignments'
}

const Page = () => {
  return (
    <RequirePermission module={'assignment'}>
      <AssignmentList />
    </RequirePermission>
  )
}

export default Page
