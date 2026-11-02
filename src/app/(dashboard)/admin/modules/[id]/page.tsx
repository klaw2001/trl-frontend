// Next Imports
import type { Metadata } from 'next'

// Component Imports
import ModuleEditor from '@views/admin/modules/editor/ModuleEditor'
import RequirePermission from '@/hocs/RequirePermission'

export const metadata: Metadata = {
  title: 'Edit Module'
}

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params

  return (
    <RequirePermission module={'training'}>
      <ModuleEditor id={id} />
    </RequirePermission>
  )
}

export default Page
