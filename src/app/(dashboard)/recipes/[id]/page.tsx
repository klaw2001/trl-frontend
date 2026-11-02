// Next Imports
import type { Metadata } from 'next'

// Component Imports
import RecipeDetail from '@views/recipes/RecipeDetail'

export const metadata: Metadata = {
  title: 'Recipe'
}

const RecipePage = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params

  return <RecipeDetail id={id} />
}

export default RecipePage
