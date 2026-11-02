'use client'

// React Imports
import type { ReactNode } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'

// Component Imports
import EmptyState from '@/components/EmptyState'

// Hook Imports
import { useAuth } from '@/hooks/useAuth'

type Props = {
  module: string | string[]
  level?: 'read' | 'write'
  children: ReactNode
}

// Hides management screens from roles without the permission (the API enforces it as well)
const RequirePermission = ({ module, level = 'read', children }: Props) => {
  const { can } = useAuth()

  if (!can(module, level)) {
    return (
      <Card>
        <EmptyState
          icon='tabler-lock'
          title='No access'
          description='Your role does not have permission to open this page.'
          action={
            <Button variant='tonal' component={Link} href='/home'>
              Go home
            </Button>
          }
        />
      </Card>
    )
  }

  return <>{children}</>
}

export default RequirePermission
