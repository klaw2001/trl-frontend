'use client'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import NavToggle from './NavToggle'
import Logo from '@components/layout/shared/Logo'
import ModeDropdown from '@components/layout/shared/ModeDropdown'
import ThemeDropdown from '@components/layout/shared/ThemeDropdown'
import UserDropdown from '@components/layout/shared/UserDropdown'
import NotificationButton from '@components/layout/shared/NotificationButton'
import ShiftChip from '@components/layout/shared/ShiftChip'

// Hook Imports
import useHorizontalNav from '@menu/hooks/useHorizontalNav'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'

const NavbarContent = () => {
  // Hooks
  const { isBreakpointReached } = useHorizontalNav()

  return (
    <div
      className={classnames(horizontalLayoutClasses.navbarContent, 'flex items-center justify-between gap-4 is-full')}
    >
      <div className='flex items-center gap-4'>
        <NavToggle />
        {/* Hide Logo on Smaller screens */}
        {!isBreakpointReached && <Logo />}
        <ShiftChip />
      </div>
      <div className='flex items-center gap-1'>
        <ThemeDropdown />
        <ModeDropdown />
        <NotificationButton />
        <UserDropdown />
      </div>
    </div>
  )
}

export default NavbarContent
