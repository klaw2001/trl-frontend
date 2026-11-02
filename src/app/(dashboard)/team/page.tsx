// Next Imports
import type { Metadata } from 'next'

// Component Imports
import TeamProgress from '@views/team/TeamProgress'
import RequirePermission from '@/hocs/RequirePermission'

export const metadata: Metadata = {
  title: 'Team Progress'
}

const Page = () => {
  return (
    <RequirePermission module={'report'}>
      <TeamProgress />
    </RequirePermission>
  )
}

export default Page
