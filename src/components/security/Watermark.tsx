'use client'

// React Imports
import { useEffect, useState } from 'react'

type Props = {
  text: string
  moving?: boolean
}

// Viewer identity drawn over protected content so screenshots and recordings can be traced
const Watermark = ({ text, moving = false }: Props) => {
  // States
  const [now, setNow] = useState(() => new Date())
  const [position, setPosition] = useState({ top: 20, left: 10 })

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 60 * 1000)

    const mover = moving
      ? setInterval(() => setPosition({ top: 10 + Math.random() * 70, left: 5 + Math.random() * 55 }), 7000)
      : null

    return () => {
      clearInterval(clock)

      if (mover) {
        clearInterval(mover)
      }
    }
  }, [moving])

  const label = `${text} · ${now.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}`

  if (moving) {
    return (
      <div
        className='absolute pointer-events-none select-none z-[3] text-white/60 text-xs sm:text-sm font-medium transition-all duration-1000'
        style={{ top: `${position.top}%`, left: `${position.left}%`, textShadow: '0 0 3px rgb(0 0 0 / 0.7)' }}
      >
        {label}
      </div>
    )
  }

  return (
    <div
      aria-hidden
      className='absolute inset-0 pointer-events-none select-none z-[3] overflow-hidden'
      style={{ opacity: 0.08 }}
    >
      <div className='absolute -inset-1/2 flex flex-wrap content-start gap-x-16 gap-y-20 -rotate-[24deg]'>
        {Array.from({ length: 80 }).map((_, index) => (
          <span key={index} className='text-textPrimary text-sm font-semibold whitespace-nowrap'>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default Watermark
