'use client'

// Third-party Imports
import classnames from 'classnames'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'

const FooterContent = () => {
  return (
    <div
      className={classnames(horizontalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}
    >
      <p className='text-textSecondary'>{`© ${new Date().getFullYear()} Indoventura Foodteck Private Limited`}</p>
      <p className='text-textDisabled'>Content is confidential. Do not share or record.</p>
    </div>
  )
}

export default FooterContent
