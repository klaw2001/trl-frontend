// Next Imports
import type { Metadata } from 'next'

// Component Imports
import CategoryList from '@views/admin/categories/CategoryList'
import RequirePermission from '@/hocs/RequirePermission'

export const metadata: Metadata = {
  title: 'Categories'
}

const Page = () => {
  return (
    <RequirePermission module={'category'}>
      <CategoryList />
    </RequirePermission>
  )
}

export default Page
