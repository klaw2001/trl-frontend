'use client'

// React Imports
import { useState } from 'react'
import type { ReactNode } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import ProtectedContent from '@/components/security/ProtectedContent'
import SecureVideoPlayer from '@/components/security/SecureVideoPlayer'
import ShiftLockCard from '@/components/ShiftLockCard'
import EmptyState from '@/components/EmptyState'

// Hook Imports
import { useApi } from '@/hooks/useApi'

// Lib Imports
import { api, errorMessage } from '@/libs/api'

// Type Imports
import type { VideoPlayback } from '@/types/apiTypes'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

export type RecipeData = {
  recipe_id: number
  recipe_name: string
  recipe_code: string | null
  recipe_description: string | null
  recipe_portion_size: string | null
  recipe_yield: string | null
  recipe_prep_time_minutes: number | null
  recipe_cook_time_minutes: number | null
  recipe_equipment: string[]
  recipe_cooking_instructions: string | null
  recipe_plating_instructions: string | null
  recipe_storage_instructions: string | null
  recipe_shelf_life: string | null
  recipe_food_safety: string | null
  recipe_common_mistakes: string[]
  recipe_quality_checkpoints: string[]
  recipe_revision: number
  plating_image_url: string | null
  recipe_brand: { brand_name: string } | null
  recipe_category: { cat_name: string } | null
  ingredients: {
    ri_id: number
    ri_name: string
    ri_quantity: string | null
    ri_unit: string | null
    ri_note: string | null
  }[]
  steps: { rs_id: number; rs_instruction: string; rs_duration_minutes: number | null; image_url: string | null }[]
  video: { video_id: number; duration: number | null } | null
}

const Section = ({ title, icon, children }: { title: string; icon: string; children: ReactNode }) => (
  <Card>
    <CardHeader title={title} avatar={<i className={`${icon} text-xl text-primary`} />} />
    <CardContent>{children}</CardContent>
  </Card>
)

const Paragraph = ({ text }: { text: string | null }) =>
  text ? <Typography className='whitespace-pre-line'>{text}</Typography> : null

// Recipe sheet used by the library and by the admin preview
export const RecipeSheet = ({ recipe, video }: { recipe: RecipeData; video?: ReactNode }) => {
  const totalTime = (recipe.recipe_prep_time_minutes || 0) + (recipe.recipe_cook_time_minutes || 0)

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, lg: 7 }} className='flex flex-col gap-6'>
        {video}
        {recipe.plating_image_url && (
          <Card>
            <img
              src={recipe.plating_image_url}
              alt={`${recipe.recipe_name} plating`}
              className='is-full max-bs-[420px] object-cover'
              draggable={false}
            />
          </Card>
        )}
        <Section title='Preparation steps' icon='tabler-list-numbers'>
          <ol className='flex flex-col gap-4'>
            {recipe.steps.map((step, index) => (
              <li key={step.rs_id} className='flex gap-3'>
                <Chip size='small' color='primary' label={index + 1} />
                <div className='flex flex-col gap-2'>
                  <Typography>{step.rs_instruction}</Typography>
                  {step.rs_duration_minutes && (
                    <Typography variant='body2' color='text.secondary'>
                      {step.rs_duration_minutes} min
                    </Typography>
                  )}
                  {step.image_url && (
                    <img src={step.image_url} alt='' className='max-bs-[220px] rounded' draggable={false} />
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Section>
        {(recipe.recipe_cooking_instructions || recipe.recipe_plating_instructions) && (
          <Section title='Cooking, heating & plating' icon='tabler-flame'>
            <div className='flex flex-col gap-3'>
              <Paragraph text={recipe.recipe_cooking_instructions} />
              <Paragraph text={recipe.recipe_plating_instructions} />
            </div>
          </Section>
        )}
      </Grid>
      <Grid size={{ xs: 12, lg: 5 }} className='flex flex-col gap-6'>
        <Card>
          <CardContent className='grid grid-cols-2 gap-4'>
            {[
              { label: 'Portion', value: recipe.recipe_portion_size },
              { label: 'Yield', value: recipe.recipe_yield },
              {
                label: 'Prep',
                value: recipe.recipe_prep_time_minutes ? `${recipe.recipe_prep_time_minutes} min` : null
              },
              { label: 'Total time', value: totalTime ? `${totalTime} min` : null }
            ].map(item => (
              <div key={item.label}>
                <Typography variant='body2' color='text.secondary'>
                  {item.label}
                </Typography>
                <Typography className='font-medium'>{item.value || '—'}</Typography>
              </div>
            ))}
          </CardContent>
        </Card>
        <Section title='Ingredients' icon='tabler-basket'>
          <table className={tableStyles.table}>
            <tbody>
              {recipe.ingredients.map(item => (
                <tr key={item.ri_id}>
                  <td>
                    {item.ri_name}
                    {item.ri_note && (
                      <Typography variant='body2' color='text.secondary'>
                        {item.ri_note}
                      </Typography>
                    )}
                  </td>
                  <td className='text-end font-medium whitespace-nowrap'>
                    {item.ri_quantity !== null ? `${Number(item.ri_quantity)} ${item.ri_unit || ''}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        {recipe.recipe_equipment.length > 0 && (
          <Section title='Equipment' icon='tabler-tools'>
            <div className='flex flex-wrap gap-2'>
              {recipe.recipe_equipment.map(item => (
                <Chip key={item} variant='outlined' label={item} />
              ))}
            </div>
          </Section>
        )}
        {(recipe.recipe_storage_instructions || recipe.recipe_shelf_life || recipe.recipe_food_safety) && (
          <Section title='Storage & food safety' icon='tabler-shield-check'>
            <div className='flex flex-col gap-3'>
              {recipe.recipe_shelf_life && (
                <Typography>
                  <strong>Shelf life:</strong> {recipe.recipe_shelf_life}
                </Typography>
              )}
              <Paragraph text={recipe.recipe_storage_instructions} />
              <Paragraph text={recipe.recipe_food_safety} />
            </div>
          </Section>
        )}
        {recipe.recipe_quality_checkpoints.length > 0 && (
          <Section title='Quality checkpoints' icon='tabler-checkbox'>
            <ul className='flex flex-col gap-2'>
              {recipe.recipe_quality_checkpoints.map(item => (
                <li key={item} className='flex gap-2'>
                  <i className='tabler-check text-success' /> {item}
                </li>
              ))}
            </ul>
          </Section>
        )}
        {recipe.recipe_common_mistakes.length > 0 && (
          <Section title='Common mistakes' icon='tabler-alert-triangle'>
            <ul className='flex flex-col gap-2'>
              {recipe.recipe_common_mistakes.map(item => (
                <li key={item} className='flex gap-2'>
                  <i className='tabler-x text-error' /> {item}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </Grid>
    </Grid>
  )
}

const RecipeDetail = ({ id }: { id: string }) => {
  // Hooks
  const { data, loading, error } = useApi<RecipeData>(`/library/recipe/${id}`)

  // States
  const [playback, setPlayback] = useState<VideoPlayback | null>(null)
  const [loadingVideo, setLoadingVideo] = useState(false)

  const loadVideo = async () => {
    setLoadingVideo(true)

    try {
      const res = await api.get<VideoPlayback>(`/library/recipe/${id}/play`)

      setPlayback(res.data)

      return res.data
    } catch (err) {
      toast.error(errorMessage(err))

      return null
    } finally {
      setLoadingVideo(false)
    }
  }

  if (error?.code === 'OUTSIDE_SHIFT') {
    return <ShiftLockCard shift={error.data?.shift} />
  }

  if (error) {
    return (
      <Card>
        <EmptyState
          icon='tabler-chef-hat'
          title={error.message}
          action={
            <Button component={Link} href='/recipes'>
              Back to library
            </Button>
          }
        />
      </Card>
    )
  }

  if (loading || !data) {
    return <LinearProgress />
  }

  return (
    <ProtectedContent>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-1'>
          <Typography component={Link} href='/recipes' color='primary.main' className='flex items-center gap-1'>
            <i className='tabler-chevron-left' /> Recipe library
          </Typography>
          <Typography variant='h4'>{data.recipe_name}</Typography>
          <Typography color='text.secondary'>
            {[data.recipe_code, data.recipe_category?.cat_name, data.recipe_brand?.brand_name]
              .filter(Boolean)
              .join(' · ')}
          </Typography>
          {data.recipe_description && <Typography>{data.recipe_description}</Typography>}
        </div>
        <RecipeSheet
          recipe={data}
          video={
            data.video &&
            (playback ? (
              <SecureVideoPlayer playback={playback} onRefresh={loadVideo} />
            ) : (
              <Card>
                <CardContent className='flex flex-col items-center gap-3 plb-10'>
                  <i className='tabler-player-play text-[48px] text-primary' />
                  <Button variant='contained' onClick={loadVideo} disabled={loadingVideo}>
                    Play preparation video
                  </Button>
                </CardContent>
              </Card>
            ))
          }
        />
      </div>
    </ProtectedContent>
  )
}

export default RecipeDetail
