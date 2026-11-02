// Next Imports
import type { Metadata } from 'next'

// Component Imports
import AuditLog from '@views/admin/audit/AuditLog'
import RequirePermission from '@/hocs/RequirePermission'

export const metadata: Metadata = {
  title: 'Audit Log'
}

const Page = () => {
  return (
    <RequirePermission module={'audit'}>
      <AuditLog />
    </RequirePermission>
  )
}

export default Page
