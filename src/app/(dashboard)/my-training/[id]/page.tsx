// Next Imports
import type { Metadata } from 'next'

// Component Imports
import ModulePlayer from '@views/learn/player/ModulePlayer'

export const metadata: Metadata = {
  title: 'Training'
}

const ModulePlayerPage = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params

  return <ModulePlayer id={id} />
}

export default ModulePlayerPage
