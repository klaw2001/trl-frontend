'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import LinearProgress from '@mui/material/LinearProgress'
import Pagination from '@mui/material/Pagination'
import Typography from '@mui/material/Typography'

// Component Imports
import PageHeader from '@/components/PageHeader'
import DebouncedInput from '@/components/DebouncedInput'
import EmptyState from '@/components/EmptyState'
import ShiftLockCard from '@/components/ShiftLockCard'

// Hook Imports
import { useApi } from '@/hooks/useApi'
import { useOptions } from '@/hooks/useOptions'

// Type Imports
import type { Paged } from '@/types/apiTypes'

type RecipeCard = {
  recipe_id: number
  recipe_name: string
  recipe_code: string | null
  recipe_description: string | null
  recipe_prep_time_minutes: number | null
  recipe_cook_time_minutes: number | null
  recipe_portion_size: string | null
  has_video: boolean
  plating_image_url: string | null
  recipe_brand: { brand_name: string } | null
  recipe_category: { cat_id: number; cat_name: string } | null
}

const PAGE_SIZE = 12

const RecipeLibrary = () => {
  // States
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  // Hooks
  const { options: categories } = useOptions('categories', { type: 'recipe' })

  const { data, loading, error } = useApi<Paged<RecipeCard>>('/library/recipes', {
    search,
    category_id: categoryId,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE
  })

  if (error?.code === 'OUTSIDE_SHIFT') {
    return (
      <>
        <PageHeader title='Recipe Library' />
        <ShiftLockCard shift={error.data?.shift} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title='Recipe Library'
        subtitle='Search and replay the recipes for your brand any time during your shift'
      />
      <Card className='mbe-6'>
        <CardContent className='flex flex-col gap-4'>
          <DebouncedInput
            fullWidth
            value={search}
            onChange={value => {
              setSearch(value)
              setPage(1)
            }}
            placeholder='Search by recipe, code or ingredient'
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='tabler-search' />
                  </InputAdornment>
                )
              }
            }}
          />
          <div className='flex flex-wrap gap-2'>
            <Chip
              label='All'
              color={categoryId === null ? 'primary' : 'default'}
              variant={categoryId === null ? 'filled' : 'outlined'}
              onClick={() => setCategoryId(null)}
            />
            {categories.map(category => (
              <Chip
                key={category.value}
                label={category.label}
                color={categoryId === category.value ? 'primary' : 'default'}
                variant={categoryId === category.value ? 'filled' : 'outlined'}
                onClick={() => {
                  setCategoryId(Number(category.value))
                  setPage(1)
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      {loading && <LinearProgress className='mbe-4' />}
      {data && data.rows.length === 0 ? (
        <Card>
          <EmptyState icon='tabler-chef-hat' title='No recipes found' description='Try another search or category.' />
        </Card>
      ) : (
        <Grid container spacing={6}>
          {data?.rows.map(recipe => (
            <Grid key={recipe.recipe_id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card component={Link} href={`/recipes/${recipe.recipe_id}`} className='block bs-full protected-content'>
                {recipe.plating_image_url ? (
                  <CardMedia
                    component='img'
                    image={recipe.plating_image_url}
                    alt={recipe.recipe_name}
                    className='bs-[160px] object-cover'
                  />
                ) : (
                  <div className='flex items-center justify-center bs-[160px] bg-actionHover'>
                    <i className='tabler-tools-kitchen-2 text-[48px] text-textDisabled' />
                  </div>
                )}
                <CardContent className='flex flex-col gap-2'>
                  <div className='flex flex-wrap gap-1'>
                    {recipe.recipe_category && (
                      <Chip size='small' variant='tonal' label={recipe.recipe_category.cat_name} />
                    )}
                    {recipe.has_video && (
                      <Chip
                        size='small'
                        variant='tonal'
                        color='info'
                        icon={<i className='tabler-player-play' />}
                        label='Video'
                      />
                    )}
                  </div>
                  <Typography variant='h6'>{recipe.recipe_name}</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {[
                      recipe.recipe_code,
                      recipe.recipe_portion_size,
                      recipe.recipe_prep_time_minutes || recipe.recipe_cook_time_minutes
                        ? `${(recipe.recipe_prep_time_minutes || 0) + (recipe.recipe_cook_time_minutes || 0)} min`
                        : null
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      {data && data.total > PAGE_SIZE && (
        <div className='flex justify-center mbs-6'>
          <Pagination
            count={Math.ceil(data.total / PAGE_SIZE)}
            page={page}
            onChange={(_, value) => setPage(value)}
            color='primary'
            shape='rounded'
          />
        </div>
      )}
    </>
  )
}

export default RecipeLibrary
