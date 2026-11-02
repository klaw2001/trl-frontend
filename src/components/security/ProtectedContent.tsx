'use client'

// React Imports
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'

// Component Imports
import Watermark from './Watermark'

// Hook Imports
import { useAuth } from '@/hooks/useAuth'

// Util Imports
import { fullName } from '@/utils/format'

type Props = {
  children: ReactNode
  className?: string
}

const BLOCKED_SHORTCUTS = ['s', 'p', 'c', 'u']

// Deterrents for copying training and recipe content. Browsers cannot fully prevent screenshots or
// screen recording; the watermark identifies the viewer if content leaks.
const ProtectedContent = ({ children, className }: Props) => {
  // States
  const [hidden, setHidden] = useState(false)

  // Hooks
  const { profile } = useAuth()

  useEffect(() => {
    const hide = () => setHidden(true)
    const show = () => setHidden(false)

    // Focus moving into an embedded document (PDF lesson) also blurs the window
    const onBlur = () =>
      setTimeout(() => {
        if (!(document.activeElement instanceof HTMLIFrameElement)) {
          hide()
        }
      }, 0)

    const onVisibility = () => (document.hidden ? hide() : show())

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && BLOCKED_SHORTCUTS.includes(event.key.toLowerCase())) {
        event.preventDefault()
      }

      if (event.key === 'PrintScreen') {
        hide()
        navigator.clipboard?.writeText('').catch(() => undefined)
        setTimeout(show, 1500)
      }
    }

    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', show)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyDown)

    return () => {
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', show)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyDown)
    }
  }, [])

  const block = (event: { preventDefault: () => void }) => event.preventDefault()

  return (
    <div
      className={`protected-content relative ${className || ''}`}
      onContextMenu={block}
      onCopy={block}
      onCut={block}
      onDragStart={block}
    >
      <div style={{ filter: hidden ? 'blur(18px)' : 'none', transition: 'filter 0.15s' }}>{children}</div>
      {profile && <Watermark text={`${fullName(profile.user)} · ${profile.user.user_employee_id}`} />}
      {hidden && (
        <div className='absolute inset-0 z-[4] flex items-center justify-center'>
          <Typography className='bg-backgroundPaper rounded p-4 shadow' color='text.secondary'>
            Content hidden while the window is not active
          </Typography>
        </div>
      )}
    </div>
  )
}

export default ProtectedContent
