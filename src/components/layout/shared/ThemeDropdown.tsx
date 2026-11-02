'use client'

// React Imports
import { useRef, useState } from 'react'

// MUI Imports
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

// Third-party Imports
import classnames from 'classnames'
import { useDebounce } from 'react-use'
import { HexColorPicker, HexColorInput } from 'react-colorful'

// Config Imports
import primaryColorConfig from '@configs/primaryColorConfig'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

// Util Imports
import { primaryColorStore } from '@/utils/primaryColorStore'

const defaultColor = primaryColorConfig[0].main

const swatchClassName =
  'flex items-center justify-center aspect-square p-1 rounded border cursor-pointer bg-transparent'

const activeSwatchClassName = 'border-primary outline-1 outline-primary'

const ThemeDropdown = () => {
  // States
  const [open, setOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customColor, setCustomColor] = useState<string | null>(null)

  // Refs
  const anchorRef = useRef<HTMLButtonElement>(null)

  // Hooks
  const { settings, updateSettings } = useSettings()

  // Vars
  const currentColor = settings.primaryColor ?? defaultColor
  const isPresetColor = primaryColorConfig.some(item => item.main === currentColor)

  const handleClose = () => {
    setOpen(false)
    setTooltipOpen(false)
    setShowCustom(false)
  }

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
  }

  const handleColorChange = (color: string) => {
    primaryColorStore.set(color)
    updateSettings({ primaryColor: color })
  }

  const handlePresetSelect = (color: string) => {
    setCustomColor(null)
    setShowCustom(false)
    handleColorChange(color)
  }

  const handleReset = () => {
    setCustomColor(null)
    primaryColorStore.clear()
    updateSettings({ primaryColor: defaultColor })
  }

  // Dragging the picker fires on every move, so apply the color once it settles
  useDebounce(() => customColor && handleColorChange(customColor), 200, [customColor])

  return (
    <>
      <Tooltip
        title='Theme Color'
        onOpen={() => setTooltipOpen(true)}
        onClose={() => setTooltipOpen(false)}
        open={open ? false : tooltipOpen ? true : false}
      >
        <IconButton ref={anchorRef} onClick={handleToggle} className='text-textPrimary' aria-label='Theme color'>
          <i className='tabler-palette' />
        </IconButton>
      </Tooltip>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        anchorEl={anchorRef.current}
        className='!mbs-3 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade {...TransitionProps} style={{ transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top' }}>
            <Paper
              className={classnames(
                'is-[264px] p-4',
                settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg'
              )}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <div className='flex flex-col gap-4'>
                  <div className='flex items-center justify-between'>
                    <Typography className='font-medium' color='text.primary'>
                      Theme Color
                    </Typography>
                    <Button size='small' onClick={handleReset} disabled={currentColor === defaultColor}>
                      Reset
                    </Button>
                  </div>
                  <div className='grid grid-cols-6 gap-2'>
                    {primaryColorConfig.map(item => (
                      <button
                        key={item.main}
                        type='button'
                        aria-label={item.main}
                        className={classnames(swatchClassName, { [activeSwatchClassName]: currentColor === item.main })}
                        onClick={() => handlePresetSelect(item.main)}
                      >
                        <span className='is-full bs-full rounded' style={{ backgroundColor: item.main }} />
                      </button>
                    ))}
                    <button
                      type='button'
                      aria-label='Custom color'
                      className={classnames(swatchClassName, { [activeSwatchClassName]: !isPresetColor })}
                      onClick={() => setShowCustom(prev => !prev)}
                    >
                      <span
                        className='flex items-center justify-center is-full bs-full rounded'
                        style={{
                          backgroundColor: isPresetColor ? 'var(--mui-palette-action-selected)' : currentColor,
                          color: isPresetColor
                            ? 'var(--mui-palette-text-primary)'
                            : 'var(--mui-palette-primary-contrastText)'
                        }}
                      >
                        <i className='tabler-color-picker text-base' />
                      </span>
                    </button>
                  </div>
                  {showCustom && (
                    <div className='flex flex-col gap-3'>
                      <HexColorPicker
                        color={customColor ?? currentColor}
                        onChange={setCustomColor}
                        style={{ inlineSize: '100%', blockSize: 160 }}
                      />
                      <HexColorInput
                        color={customColor ?? currentColor}
                        onChange={setCustomColor}
                        prefixed
                        placeholder='Type a color'
                        className='is-full rounded border bg-transparent pli-2.5 plb-2 text-sm text-textPrimary outline-none focus:border-primary'
                      />
                    </div>
                  )}
                </div>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default ThemeDropdown
