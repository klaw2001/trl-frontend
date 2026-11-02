// React Imports
import { Suspense } from 'react'

// Next Imports
import type { Metadata } from 'next'

// Component Imports
import Login from '@views/auth/Login'
import GuestOnlyRoute from '@/hocs/GuestOnlyRoute'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your training account'
}

const LoginPage = async () => {
  // Vars
  const mode = await getServerMode()

  return (
    <GuestOnlyRoute>
      <Suspense>
        <Login mode={mode} />
      </Suspense>
    </GuestOnlyRoute>
  )
}

export default LoginPage
