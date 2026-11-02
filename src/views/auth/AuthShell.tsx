'use client'

// React Imports
import type { ReactNode } from 'react'

// MUI Imports
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { SystemMode } from '@core/types'

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'

// Styled Custom Components
const Illustration = styled('img')(({ theme }) => ({
  zIndex: 2,
  blockSize: 'auto',
  maxBlockSize: 680,
  maxInlineSize: '100%',
  margin: theme.spacing(12),
  [theme.breakpoints.down(1536)]: {
    maxBlockSize: 550
  },
  [theme.breakpoints.down('lg')]: {
    maxBlockSize: 450
  }
}))

const MaskImg = styled('img')({
  blockSize: 'auto',
  maxBlockSize: 355,
  inlineSize: '100%',
  position: 'absolute',
  insetBlockEnd: 0,
  zIndex: -1
})

type Props = {
  mode: SystemMode
  title: string
  subtitle?: ReactNode
  children: ReactNode
}

// Two column auth layout shared by login, forgot password and change password
const AuthShell = ({ mode, title, subtitle, children }: Props) => {
  // Hooks
  const { settings } = useSettings()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const authBackground = useImageVariant(mode, '/images/pages/auth-mask-light.png', '/images/pages/auth-mask-dark.png')

  const illustration = useImageVariant(
    mode,
    '/images/illustrations/auth/v2-login-light.png',
    '/images/illustrations/auth/v2-login-dark.png',
    '/images/illustrations/auth/v2-login-light-border.png',
    '/images/illustrations/auth/v2-login-dark-border.png'
  )

  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          { 'border-ie': settings.skin === 'bordered' }
        )}
      >
        <Illustration src={illustration} alt='Training illustration' />
        {!hidden && <MaskImg alt='' src={authBackground} />}
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </div>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4'>{title}</Typography>
            {subtitle && <Typography>{subtitle}</Typography>}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthShell
