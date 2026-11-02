// Next Imports
import type { Metadata } from 'next'

// Component Imports
import Reports from '@views/reports/Reports'
import RequirePermission from '@/hocs/RequirePermission'

export const metadata: Metadata = {
  title: 'Reports'
}

const Page = () => {
  return (
    <RequirePermission module={'report'}>
      <Reports />
    </RequirePermission>
  )
}

export default Page
