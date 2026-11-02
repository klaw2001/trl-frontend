// Next Imports
import type { Metadata } from 'next'

// Component Imports
import RecipeList from '@views/admin/recipes/RecipeList'
import RequirePermission from '@/hocs/RequirePermission'

export const metadata: Metadata = {
  title: 'Recipes'
}

const Page = () => {
  return (
    <RequirePermission module={'recipe'}>
      <RecipeList />
    </RequirePermission>
  )
}

export default Page
