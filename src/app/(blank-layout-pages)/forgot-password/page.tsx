// Next Imports
import type { Metadata } from 'next'

// Component Imports
import ForgotPassword from '@views/auth/ForgotPassword'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata: Metadata = {
  title: 'Forgot Password'
}

const ForgotPasswordPage = async () => {
  // Vars
  const mode = await getServerMode()

  return <ForgotPassword mode={mode} />
}

export default ForgotPasswordPage
