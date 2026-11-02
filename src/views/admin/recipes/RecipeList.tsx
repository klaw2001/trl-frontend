'use client'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Component Imports
import PageHeader from '@/components/PageHeader'
import ServerTable from '@/components/ServerTable'
import DebouncedInput from '@/components/DebouncedInput'
import SelectField from '@/components/form/SelectField'
import { ContentStateChip } from '@/components/StatusChip'

// Hook Imports
import { useServerTable } from '@/hooks/useServerTable'
import { useOptions } from '@/hooks/useOptions'
import { useAuth } from '@/hooks/useAuth'

// Util Imports
import { formatDateTime } from '@/utils/format'

type RecipeRow = {
  recipe_id: number
  recipe_name: string
  recipe_code: string | null
  recipe_is_published: boolean
  recipe_archived: boolean
  recipe_revision: number
  recipe_updated_at: string
  plating_image_url: string | null
  recipe_brand: { brand_name: string } | null
  recipe_category: { cat_name: string } | null
  recipe_video: { video_state: string } | null
}

const PUBLISHED = [
  { value: '1', label: 'Published' },
  { value: '0', label: 'Unpublished' }
]

const RecipeList = () => {
  // Hooks
  const router = useRouter()
  const { can } = useAuth()
  const { options: brands } = useOptions('brands')
  const { options: categories } = useOptions('categories', { type: 'recipe' })

  const { rows, filters, setFilter, tableProps } = useServerTable<RecipeRow>('/recipe/all', {
    search: '',
    brand_id: '',
    category_id: '',
    published: '',
    archived: '0'
  })

  return (
    <>
      <PageHeader
        title='Recipes'
        subtitle='Recipe sheets and preparation videos for the library'
        actions={
          can('recipe', 'write') && (
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => router.push('/admin/recipes/new')}
            >
              New recipe
            </Button>
          )
        }
      />
      <Card>
        <CardContent className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <DebouncedInput
            value={filters.search}
            onChange={value => setFilter('search', value)}
            placeholder='Search name or code'
          />
          <SelectField
            label=''
            options={brands}
            emptyLabel='All brands'
            value={filters.brand_id}
            onChange={value => setFilter('brand_id', value || '')}
          />
          <SelectField
            label=''
            options={categories}
            emptyLabel='All categories'
            value={filters.category_id}
            onChange={value => setFilter('category_id', value || '')}
          />
          <SelectField
            label=''
            options={PUBLISHED}
            emptyLabel='Any status'
            value={filters.published}
            onChange={value => setFilter('published', value || '')}
          />
        </CardContent>
        <ServerTable
          {...tableProps}
          rows={rows}
          rowKey={row => row.recipe_id}
          onRowClick={row => router.push(`/admin/recipes/${row.recipe_id}`)}
          columns={[
            {
              key: 'name',
              header: 'Recipe',
              render: row => (
                <div className='flex items-center gap-3'>
                  {row.plating_image_url ? (
                    <img src={row.plating_image_url} alt='' className='is-10 bs-10 rounded object-cover' />
                  ) : (
                    <div className='flex items-center justify-center is-10 bs-10 rounded bg-actionHover'>
                      <i className='tabler-tools-kitchen-2' />
                    </div>
                  )}
                  <div className='flex flex-col'>
                    <Typography color='text.primary' className='font-medium'>
                      {row.recipe_name}
                    </Typography>
                    <Typography variant='body2'>{row.recipe_code}</Typography>
                  </div>
                </div>
              )
            },
            { key: 'brand', header: 'Brand', render: row => row.recipe_brand?.brand_name || 'All brands' },
            { key: 'category', header: 'Category', render: row => row.recipe_category?.cat_name || '—' },
            { key: 'video', header: 'Video', render: row => row.recipe_video?.video_state || '—' },
            {
              key: 'status',
              header: 'Status',
              render: row => <ContentStateChip published={row.recipe_is_published} archived={row.recipe_archived} />
            },
            {
              key: 'revision',
              header: 'Revision',
              render: row => (row.recipe_revision ? `r${row.recipe_revision}` : '—')
            },
            { key: 'updated', header: 'Updated', render: row => formatDateTime(row.recipe_updated_at) }
          ]}
        />
      </Card>
    </>
  )
}

export default RecipeList
