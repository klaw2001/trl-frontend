// Next Imports
import type { Metadata } from 'next'

// Component Imports
import RecipeLibrary from '@views/recipes/RecipeLibrary'

export const metadata: Metadata = {
  title: 'Recipe Library'
}

const RecipesPage = () => {
  return <RecipeLibrary />
}

export default RecipesPage
