// Next Imports
import type { Metadata } from 'next'

// Component Imports
import VideoLibrary from '@views/admin/videos/VideoLibrary'
import RequirePermission from '@/hocs/RequirePermission'

export const metadata: Metadata = {
  title: 'Video Library'
}

const Page = () => {
  return (
    <RequirePermission module={['training', 'recipe']} level='write'>
      <VideoLibrary />
    </RequirePermission>
  )
}

export default Page
