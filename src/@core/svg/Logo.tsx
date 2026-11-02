// React Imports
import type { SVGAttributes } from 'react'

// Chef hat mark
const Logo = (props: SVGAttributes<SVGElement>) => {
  return (
    <svg width='1em' height='1em' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        d='M12 3c1.7 0 3.2.9 4 2.3A4 4 0 0 1 18 13v6a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-6A4 4 0 0 1 8 5.3 4.6 4.6 0 0 1 12 3Z'
        fill='currentColor'
        opacity='0.2'
      />
      <path
        d='M12 3c1.7 0 3.2.9 4 2.3A4 4 0 0 1 18 13v6a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-6A4 4 0 0 1 8 5.3 4.6 4.6 0 0 1 12 3Zm-5 13h10'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export default Logo
