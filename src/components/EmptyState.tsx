// React Imports
import type { ReactNode } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

type Props = {
  icon?: string
  title: string
  description?: ReactNode
  action?: ReactNode
}

const EmptyState = ({ icon = 'tabler-mood-empty', title, description, action }: Props) => {
  return (
    <div className='flex flex-col items-center justify-center text-center gap-3 plb-12 pli-6'>
      <CustomAvatar skin='light' color='primary' size={56}>
        <i className={`${icon} text-[28px]`} />
      </CustomAvatar>
      <Typography variant='h5'>{title}</Typography>
      {description && <Typography color='text.secondary'>{description}</Typography>}
      {action}
    </div>
  )
}

export default EmptyState
