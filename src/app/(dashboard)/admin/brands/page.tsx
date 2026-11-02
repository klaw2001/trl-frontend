// Next Imports
import type { Metadata } from 'next'

// Component Imports
import BrandList from '@views/admin/brands/BrandList'
import RequirePermission from '@/hocs/RequirePermission'

export const metadata: Metadata = {
  title: 'Brands'
}

const Page = () => {
  return (
    <RequirePermission module={'brand'}>
      <BrandList />
    </RequirePermission>
  )
}

export default Page
