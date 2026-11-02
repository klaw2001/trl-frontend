// React Imports
import type { ReactNode } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'

type Props = {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}

const PageHeader = ({ title, subtitle, actions }: Props) => {
  return (
    <div className='flex flex-wrap items-start justify-between gap-4 mbe-6'>
      <div className='flex flex-col gap-1'>
        <Typography variant='h4'>{title}</Typography>
        {subtitle && <Typography color='text.secondary'>{subtitle}</Typography>}
      </div>
      {actions && <div className='flex flex-wrap items-center gap-2'>{actions}</div>}
    </div>
  )
}

export default PageHeader
