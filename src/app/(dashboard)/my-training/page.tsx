// React Imports
import { Suspense } from 'react'

// Next Imports
import type { Metadata } from 'next'

// Component Imports
import MyTraining from '@views/learn/MyTraining'

export const metadata: Metadata = {
  title: 'My Training'
}

const MyTrainingPage = () => {
  return (
    <Suspense>
      <MyTraining />
    </Suspense>
  )
}

export default MyTrainingPage
