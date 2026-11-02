// React Imports
import { useEffect } from 'react'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

// Util Imports
import { primaryColorStore } from '@/utils/primaryColorStore'

const PrimaryColorChanger = () => {
  // Hooks
  const { settings, updateSettings } = useSettings()

  // localStorage is not readable during SSR, so apply the saved color once mounted
  useEffect(() => {
    const savedColor = primaryColorStore.get()

    if (savedColor && savedColor !== settings.primaryColor) {
      updateSettings({ primaryColor: savedColor })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

export default PrimaryColorChanger
