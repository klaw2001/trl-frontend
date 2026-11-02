// Next Imports
import type { Metadata } from 'next'

// Component Imports
import UserHistory from '@views/team/UserHistory'
import RequirePermission from '@/hocs/RequirePermission'

export const metadata: Metadata = {
  title: 'Training History'
}

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params

  return (
    <RequirePermission module={'report'}>
      <UserHistory id={id} />
    </RequirePermission>
  )
}

export default Page
