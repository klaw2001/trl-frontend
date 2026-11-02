// Next Imports
import type { Metadata } from 'next'

// Component Imports
import Home from '@views/home/Home'

export const metadata: Metadata = {
  title: 'Home'
}

const HomePage = () => {
  return <Home />
}

export default HomePage
