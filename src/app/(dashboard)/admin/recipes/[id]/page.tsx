// Next Imports
import type { Metadata } from 'next'

// Component Imports
import RecipeEditor from '@views/admin/recipes/RecipeEditor'
import RequirePermission from '@/hocs/RequirePermission'

export const metadata: Metadata = {
  title: 'Edit Recipe'
}

const Page = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params

  return (
    <RequirePermission module={'recipe'}>
      <RecipeEditor id={id} />
    </RequirePermission>
  )
}

export default Page
