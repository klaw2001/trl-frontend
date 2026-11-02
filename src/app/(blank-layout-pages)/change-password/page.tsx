// Next Imports
import type { Metadata } from 'next'

// Component Imports
import ChangePassword from '@views/auth/ChangePassword'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata: Metadata = {
  title: 'Set Password'
}

const ChangePasswordPage = async () => {
  // Vars
  const mode = await getServerMode()

  return <ChangePassword mode={mode} />
}

export default ChangePasswordPage
