'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import FormDialog from '@/components/dialogs/FormDialog'
import SelectField from '@/components/form/SelectField'
import MultiSelectField from '@/components/form/MultiSelectField'
import StringListField from '@/components/form/StringListField'
import FileUploadButton from '@/components/form/FileUploadButton'
import VideoPicker from '@/components/media/VideoPicker'
import ServerTable from '@/components/ServerTable'
import { ContentStateChip } from '@/components/StatusChip'
import CustomTextField from '@core/components/mui/TextField'
import { RecipeSheet } from '@/views/recipes/RecipeDetail'
import type { RecipeData } from '@/views/recipes/RecipeDetail'

// Hook Imports
import { useOptions } from '@/hooks/useOptions'
import { useAuth } from '@/hooks/useAuth'

// Lib Imports
import { ApiError, api, errorMessage } from '@/libs/api'

// Util Imports
import { formatDateTime } from '@/utils/format'

type Ingredient = { ri_name: string; ri_quantity: string; ri_unit: string; ri_note: string }
type Step = {
  rs_instruction: string
  rs_duration_minutes: string
  rs_image_id: number | null
  image_url: string | null
}

type RecipeForm = {
  recipe_id?: number
  recipe_name: string
  recipe_code: string
  recipe_brand_id: number | null
  recipe_category_id: number | null
  recipe_role_ids: number[]
  recipe_description: string
  recipe_video_id: number | null
  recipe_portion_size: string
  recipe_yield: string
  recipe_prep_time_minutes: string
  recipe_cook_time_minutes: string
  recipe_equipment: string[]
  recipe_cooking_instructions: string
  recipe_plating_instructions: string
  recipe_plating_image_id: number | null
  plating_image_url: string | null
  recipe_storage_instructions: string
  recipe_shelf_life: string
  recipe_food_safety: string
  recipe_common_mistakes: string[]
  recipe_quality_checkpoints: string[]
  ingredients: Ingredient[]
  steps: Step[]
}

type Revision = { rr_id: number; rr_revision: number; rr_note: string | null; rr_created_at: string }

const emptyRecipe: RecipeForm = {
  recipe_name: '',
  recipe_code: '',
  recipe_brand_id: null,
  recipe_category_id: null,
  recipe_role_ids: [],
  recipe_description: '',
  recipe_video_id: null,
  recipe_portion_size: '',
  recipe_yield: '',
  recipe_prep_time_minutes: '',
  recipe_cook_time_minutes: '',
  recipe_equipment: [],
  recipe_cooking_instructions: '',
  recipe_plating_instructions: '',
  recipe_plating_image_id: null,
  plating_image_url: null,
  recipe_storage_instructions: '',
  recipe_shelf_life: '',
  recipe_food_safety: '',
  recipe_common_mistakes: [],
  recipe_quality_checkpoints: [],
  ingredients: [{ ri_name: '', ri_quantity: '', ri_unit: '', ri_note: '' }],
  steps: [{ rs_instruction: '', rs_duration_minutes: '', rs_image_id: null, image_url: null }]
}

const text = (value: any) => (value === null || value === undefined ? '' : String(value))

const toForm = (recipe: any): RecipeForm => ({
  ...emptyRecipe,
  ...Object.fromEntries(Object.keys(emptyRecipe).map(key => [key, recipe[key] ?? (emptyRecipe as any)[key]])),
  recipe_id: recipe.recipe_id,
  recipe_prep_time_minutes: text(recipe.recipe_prep_time_minutes),
  recipe_cook_time_minutes: text(recipe.recipe_cook_time_minutes),
  ingredients: recipe.ingredients.map((i: any) => ({
    ri_name: i.ri_name,
    ri_quantity: text(i.ri_quantity),
    ri_unit: text(i.ri_unit),
    ri_note: text(i.ri_note)
  })),
  steps: recipe.steps.map((s: any) => ({
    rs_instruction: s.rs_instruction,
    rs_duration_minutes: text(s.rs_duration_minutes),
    rs_image_id: s.rs_image_id,
    image_url: s.image_url
  }))
})

// Recipe sheet preview from unsaved form values
const toPreview = (form: RecipeForm): RecipeData => ({
  ...(form as any),
  recipe_id: form.recipe_id || 0,
  recipe_revision: 0,
  recipe_prep_time_minutes: Number(form.recipe_prep_time_minutes) || null,
  recipe_cook_time_minutes: Number(form.recipe_cook_time_minutes) || null,
  recipe_brand: null,
  recipe_category: null,
  ingredients: form.ingredients
    .filter(i => i.ri_name)
    .map((i, index) => ({ ...i, ri_id: index, ri_quantity: i.ri_quantity || null })),
  steps: form.steps
    .filter(s => s.rs_instruction)
    .map((s, index) => ({ ...s, rs_id: index, rs_duration_minutes: Number(s.rs_duration_minutes) || null })),
  video: null
})

const RecipeEditor = ({ id }: { id: string }) => {
  // States
  const [form, setForm] = useState<RecipeForm | null>(id === 'new' ? emptyRecipe : null)

  const [meta, setMeta] = useState<{ published: boolean; archived: boolean; revisions: Revision[] }>({
    published: false,
    archived: false,
    revisions: []
  })

  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<RecipeData | null>(null)

  // Hooks
  const router = useRouter()
  const { can } = useAuth()
  const { options: brands } = useOptions('brands')
  const { options: categories } = useOptions('categories', { type: 'recipe' })
  const { options: roles } = useOptions('roles')

  const canWrite = can('recipe', 'write')

  const load = async () => {
    const res = await api.get(`/recipe/single/${id}`)

    setForm(toForm(res.data))
    setMeta({
      published: res.data.recipe_is_published,
      archived: res.data.recipe_archived,
      revisions: res.data.revisions
    })
  }

  useEffect(() => {
    if (id !== 'new') {
      load().catch(error => toast.error(errorMessage(error)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!form) {
    return <LinearProgress />
  }

  const set = <K extends keyof RecipeForm>(key: K, value: RecipeForm[K]) =>
    setForm(prev => prev && { ...prev, [key]: value })

  const setRow = <K extends 'ingredients' | 'steps'>(key: K, index: number, value: Partial<RecipeForm[K][number]>) =>
    setForm(
      prev =>
        prev && { ...prev, [key]: (prev[key] as any[]).map((row, i) => (i === index ? { ...row, ...value } : row)) }
    )

  const save = async (extra: object = {}) => {
    setBusy(true)

    try {
      // Signed preview URLs are display only; undefined values are dropped from the JSON body
      const res = await api.post<{ recipe_id: number }>('/recipe/save', {
        ...form,
        ...extra,
        plating_image_url: undefined,
        steps: form.steps.map(step => ({ ...step, image_url: undefined }))
      })

      toast.success('Recipe saved')

      if (id === 'new') {
        router.replace(`/admin/recipes/${res.data.recipe_id}`)
      } else {
        await load()
      }
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const publish = async (published: boolean) => {
    setBusy(true)

    try {
      await api.post('/recipe/publish', { recipe_id: form.recipe_id, published })
      toast.success(published ? 'Recipe published' : 'Recipe unpublished')
      await load()
    } catch (error) {
      const errors = error instanceof ApiError ? error.data?.errors : null

      toast.error(errors ? `${errorMessage(error)}: ${errors.join(', ')}` : errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const openRevision = async (rr_id: number) => {
    const res = await api.get<{ rr_snapshot: any }>(`/recipe/revision/${rr_id}`)

    setPreview({
      ...res.data.rr_snapshot,
      plating_image_url: null,
      steps: res.data.rr_snapshot.steps.map((s: any) => ({ ...s, image_url: null })),
      video: null
    })
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <Typography component={Link} href='/admin/recipes' color='primary.main' className='flex items-center gap-1'>
            <i className='tabler-chevron-left' /> Recipes
          </Typography>
          <div className='flex flex-wrap items-center gap-3'>
            <Typography variant='h4'>{form.recipe_name || 'New recipe'}</Typography>
            {form.recipe_id && <ContentStateChip published={meta.published} archived={meta.archived} />}
          </div>
          {meta.published && (
            <Typography color='text.secondary'>
              Published recipes update for staff as soon as you save; every save is kept as a revision.
            </Typography>
          )}
        </div>
        {canWrite && (
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='tonal'
              color='secondary'
              startIcon={<i className='tabler-eye' />}
              onClick={() => setPreview(toPreview(form))}
            >
              Preview
            </Button>
            {form.recipe_id && (
              <Button
                variant='tonal'
                color='secondary'
                disabled={busy}
                onClick={() => save({ recipe_archived: !meta.archived })}
              >
                {meta.archived ? 'Restore' : 'Archive'}
              </Button>
            )}
            {form.recipe_id && (
              <Button
                variant='tonal'
                color={meta.published ? 'warning' : 'success'}
                disabled={busy}
                onClick={() => publish(!meta.published)}
              >
                {meta.published ? 'Unpublish' : 'Publish'}
              </Button>
            )}
            <Button variant='contained' disabled={busy} onClick={() => save()}>
              Save
            </Button>
          </div>
        )}
      </div>

      <Grid container spacing={6}>
        <Grid size={{ xs: 12, lg: 8 }} className='flex flex-col gap-6'>
          <Card>
            <CardHeader title='Basics' />
            <CardContent className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <CustomTextField
                fullWidth
                label='Recipe name'
                value={form.recipe_name}
                onChange={e => set('recipe_name', e.target.value)}
              />
              <CustomTextField
                fullWidth
                label='Code'
                value={form.recipe_code}
                onChange={e => set('recipe_code', e.target.value)}
              />
              <SelectField
                label='Brand'
                options={brands}
                emptyLabel='All brands'
                value={form.recipe_brand_id}
                onChange={value => set('recipe_brand_id', value)}
              />
              <SelectField
                label='Category'
                options={categories}
                emptyLabel='None'
                value={form.recipe_category_id}
                onChange={value => set('recipe_category_id', value)}
              />
              <div className='sm:col-span-2'>
                <MultiSelectField
                  label='Visible to roles'
                  options={roles}
                  value={form.recipe_role_ids}
                  onChange={value => set('recipe_role_ids', value)}
                  placeholder='All roles'
                />
              </div>
              <CustomTextField
                className='sm:col-span-2'
                fullWidth
                multiline
                minRows={2}
                label='Description'
                value={form.recipe_description}
                onChange={e => set('recipe_description', e.target.value)}
              />
              <CustomTextField
                fullWidth
                label='Portion size'
                placeholder='e.g. 200 ml'
                value={form.recipe_portion_size}
                onChange={e => set('recipe_portion_size', e.target.value)}
              />
              <CustomTextField
                fullWidth
                label='Yield'
                placeholder='e.g. 4 cups'
                value={form.recipe_yield}
                onChange={e => set('recipe_yield', e.target.value)}
              />
              <CustomTextField
                fullWidth
                type='number'
                label='Prep time (min)'
                value={form.recipe_prep_time_minutes}
                onChange={e => set('recipe_prep_time_minutes', e.target.value)}
              />
              <CustomTextField
                fullWidth
                type='number'
                label='Cook time (min)'
                value={form.recipe_cook_time_minutes}
                onChange={e => set('recipe_cook_time_minutes', e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title='Ingredients'
              subheader='Exact quantities'
              action={
                <Button
                  size='small'
                  startIcon={<i className='tabler-plus' />}
                  onClick={() =>
                    set('ingredients', [
                      ...form.ingredients,
                      { ri_name: '', ri_quantity: '', ri_unit: '', ri_note: '' }
                    ])
                  }
                >
                  Add
                </Button>
              }
            />
            <CardContent className='flex flex-col gap-3'>
              {form.ingredients.map((row, index) => (
                <div key={index} className='grid grid-cols-12 gap-2 items-center'>
                  <CustomTextField
                    className='col-span-12 sm:col-span-4'
                    placeholder='Ingredient'
                    value={row.ri_name}
                    onChange={e => setRow('ingredients', index, { ri_name: e.target.value })}
                  />
                  <CustomTextField
                    className='col-span-4 sm:col-span-2'
                    type='number'
                    placeholder='Qty'
                    value={row.ri_quantity}
                    onChange={e => setRow('ingredients', index, { ri_quantity: e.target.value })}
                  />
                  <CustomTextField
                    className='col-span-4 sm:col-span-2'
                    placeholder='Unit'
                    value={row.ri_unit}
                    onChange={e => setRow('ingredients', index, { ri_unit: e.target.value })}
                  />
                  <CustomTextField
                    className='col-span-10 sm:col-span-3'
                    placeholder='Note'
                    value={row.ri_note}
                    onChange={e => setRow('ingredients', index, { ri_note: e.target.value })}
                  />
                  <IconButton
                    className='col-span-2 sm:col-span-1'
                    onClick={() =>
                      set(
                        'ingredients',
                        form.ingredients.filter((_, i) => i !== index)
                      )
                    }
                  >
                    <i className='tabler-x' />
                  </IconButton>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title='Preparation steps'
              action={
                <Button
                  size='small'
                  startIcon={<i className='tabler-plus' />}
                  onClick={() =>
                    set('steps', [
                      ...form.steps,
                      { rs_instruction: '', rs_duration_minutes: '', rs_image_id: null, image_url: null }
                    ])
                  }
                >
                  Add
                </Button>
              }
            />
            <CardContent className='flex flex-col gap-4'>
              {form.steps.map((row, index) => (
                <div key={index} className='flex flex-col gap-2 p-3 border rounded'>
                  <div className='flex items-start gap-2'>
                    <Typography className='font-medium pbs-2'>{index + 1}.</Typography>
                    <CustomTextField
                      fullWidth
                      multiline
                      placeholder='Instruction'
                      value={row.rs_instruction}
                      onChange={e => setRow('steps', index, { rs_instruction: e.target.value })}
                    />
                    <IconButton
                      onClick={() =>
                        set(
                          'steps',
                          form.steps.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <i className='tabler-x' />
                    </IconButton>
                  </div>
                  <div className='flex flex-wrap items-center gap-2 pis-5'>
                    <CustomTextField
                      size='small'
                      type='number'
                      placeholder='Minutes'
                      className='is-[110px]'
                      value={row.rs_duration_minutes}
                      onChange={e => setRow('steps', index, { rs_duration_minutes: e.target.value })}
                    />
                    {row.image_url && <img src={row.image_url} alt='' className='bs-10 rounded' />}
                    <FileUploadButton
                      type='image'
                      label={row.rs_image_id ? 'Replace photo' : 'Add photo'}
                      buttonProps={{ size: 'small' }}
                      onUploaded={(file, url) => setRow('steps', index, { rs_image_id: file.file_id, image_url: url })}
                    />
                    {row.rs_image_id && (
                      <Button
                        size='small'
                        color='secondary'
                        onClick={() => setRow('steps', index, { rs_image_id: null, image_url: null })}
                      >
                        Remove photo
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title='Cooking, heating & plating' />
            <CardContent className='flex flex-col gap-4'>
              <CustomTextField
                fullWidth
                multiline
                minRows={3}
                label='Cooking / heating instructions'
                value={form.recipe_cooking_instructions}
                onChange={e => set('recipe_cooking_instructions', e.target.value)}
              />
              <CustomTextField
                fullWidth
                multiline
                minRows={2}
                label='Plating instructions'
                value={form.recipe_plating_instructions}
                onChange={e => set('recipe_plating_instructions', e.target.value)}
              />
              <StringListField
                label='Equipment required'
                value={form.recipe_equipment}
                onChange={value => set('recipe_equipment', value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title='Storage, shelf life & food safety' />
            <CardContent className='flex flex-col gap-4'>
              <CustomTextField
                fullWidth
                label='Shelf life'
                placeholder='e.g. Serve within 15 minutes'
                value={form.recipe_shelf_life}
                onChange={e => set('recipe_shelf_life', e.target.value)}
              />
              <CustomTextField
                fullWidth
                multiline
                minRows={2}
                label='Storage instructions'
                value={form.recipe_storage_instructions}
                onChange={e => set('recipe_storage_instructions', e.target.value)}
              />
              <CustomTextField
                fullWidth
                multiline
                minRows={2}
                label='Food safety'
                value={form.recipe_food_safety}
                onChange={e => set('recipe_food_safety', e.target.value)}
              />
              <StringListField
                label='Quality checkpoints'
                value={form.recipe_quality_checkpoints}
                onChange={value => set('recipe_quality_checkpoints', value)}
              />
              <StringListField
                label='Common mistakes'
                value={form.recipe_common_mistakes}
                onChange={value => set('recipe_common_mistakes', value)}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }} className='flex flex-col gap-6'>
          <Card>
            <CardHeader title='Preparation video' />
            <CardContent>
              <VideoPicker value={form.recipe_video_id} onChange={value => set('recipe_video_id', value)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader title='Plating image' />
            <CardContent className='flex flex-col gap-3'>
              {form.plating_image_url && (
                <img src={form.plating_image_url} alt='Plating' className='rounded max-bs-[240px] object-cover' />
              )}
              <div className='flex gap-2'>
                <FileUploadButton
                  type='image'
                  label={form.recipe_plating_image_id ? 'Replace image' : 'Upload image'}
                  onUploaded={(file, url) =>
                    setForm(prev => prev && { ...prev, recipe_plating_image_id: file.file_id, plating_image_url: url })
                  }
                />
                {form.recipe_plating_image_id && (
                  <Button
                    color='secondary'
                    onClick={() => setForm({ ...form, recipe_plating_image_id: null, plating_image_url: null })}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          {meta.revisions.length > 0 && (
            <Card>
              <CardHeader title='Change history' />
              <ServerTable
                rows={meta.revisions}
                rowKey={row => row.rr_id}
                onRowClick={row => openRevision(row.rr_id)}
                columns={[
                  { key: 'rev', header: 'Rev', render: row => `r${row.rr_revision}` },
                  { key: 'rr_note', header: 'Note' },
                  { key: 'when', header: 'When', render: row => formatDateTime(row.rr_created_at) }
                ]}
              />
            </Card>
          )}
        </Grid>
      </Grid>

      <FormDialog open={Boolean(preview)} title='Recipe preview' maxWidth='lg' onClose={() => setPreview(null)}>
        {preview && <RecipeSheet recipe={preview} />}
      </FormDialog>
    </div>
  )
}

export default RecipeEditor
