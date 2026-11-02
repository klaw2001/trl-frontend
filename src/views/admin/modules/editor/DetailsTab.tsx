'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

// Third-party Imports
import { toast } from 'react-toastify'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import SelectField from '@/components/form/SelectField'
import MultiSelectField from '@/components/form/MultiSelectField'
import { RichTextEditor, RichTextView } from '@/components/RichText'

// Hook Imports
import { useOptions } from '@/hooks/useOptions'

// Lib Imports
import { api, errorMessage } from '@/libs/api'

// Type Imports
import type { ModuleDetail, VersionDetail } from './types'

type Props = {
  module: ModuleDetail
  version: VersionDetail
  readOnly: boolean
  onSaved: () => void
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'mr', label: 'Marathi' },
  { value: 'gu', label: 'Gujarati' }
]

const DetailsTab = ({ module, version, readOnly, onSaved }: Props) => {
  // States
  const [settings, setSettings] = useState(module)
  const [content, setContent] = useState(version)
  const [busy, setBusy] = useState(false)

  // Hooks
  const { options: categories } = useOptions('categories', { type: 'training' })
  const { options: brands } = useOptions('brands')
  const { options: roles } = useOptions('roles')
  const { options: modules } = useOptions('training-modules')

  useEffect(() => setSettings(module), [module])
  useEffect(() => setContent(version), [version])

  const save = async (path: string, body: object, message: string) => {
    setBusy(true)

    try {
      await api.post(path, body)
      toast.success(message)
      onSaved()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, lg: 7 }}>
        <Card>
          <CardHeader
            title={`Content · version ${version.mv_version_no}`}
            subheader={
              readOnly
                ? 'Published versions are read only. Create a draft to make changes.'
                : 'Draft — learners see it after publishing'
            }
          />
          <CardContent className='flex flex-col gap-4'>
            <CustomTextField
              fullWidth
              label='Title'
              disabled={readOnly}
              value={content.mv_title}
              onChange={e => setContent({ ...content, mv_title: e.target.value })}
            />
            <CustomTextField
              fullWidth
              multiline
              minRows={2}
              label='Description'
              disabled={readOnly}
              value={content.mv_description || ''}
              onChange={e => setContent({ ...content, mv_description: e.target.value })}
            />
            <Typography className='font-medium'>SOP instructions (shown with the acknowledgement)</Typography>
            {readOnly ? (
              <RichTextView html={content.mv_instructions || '<p>—</p>'} className='p-4 border rounded' />
            ) : (
              <RichTextEditor
                value={content.mv_instructions}
                onChange={html => setContent({ ...content, mv_instructions: html })}
              />
            )}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <CustomTextField
                type='number'
                label='Minimum video watched (%)'
                disabled={readOnly}
                value={content.mv_min_watch_percent}
                onChange={e => setContent({ ...content, mv_min_watch_percent: Number(e.target.value) })}
              />
              <CustomTextField
                type='number'
                label='Pass mark (%)'
                disabled={readOnly}
                value={content.mv_pass_mark}
                onChange={e => setContent({ ...content, mv_pass_mark: Number(e.target.value) })}
              />
              <CustomTextField
                type='number'
                label='Attempts allowed'
                helperText='0 = unlimited'
                disabled={readOnly}
                value={content.mv_max_attempts}
                onChange={e => setContent({ ...content, mv_max_attempts: Number(e.target.value) })}
              />
              <CustomTextField
                type='number'
                label='Questions per attempt'
                helperText='Empty = all questions'
                disabled={readOnly}
                value={content.mv_question_limit ?? ''}
                onChange={e =>
                  setContent({ ...content, mv_question_limit: e.target.value ? Number(e.target.value) : null })
                }
              />
            </div>
            <div className='flex flex-wrap gap-4'>
              <FormControlLabel
                disabled={readOnly}
                control={
                  <Switch
                    checked={content.mv_randomize_questions}
                    onChange={e => setContent({ ...content, mv_randomize_questions: e.target.checked })}
                  />
                }
                label='Shuffle questions'
              />
              <FormControlLabel
                disabled={readOnly}
                control={
                  <Switch
                    checked={content.mv_randomize_options}
                    onChange={e => setContent({ ...content, mv_randomize_options: e.target.checked })}
                  />
                }
                label='Shuffle options'
              />
              <FormControlLabel
                disabled={readOnly}
                control={
                  <Switch
                    checked={content.mv_requires_ack}
                    onChange={e => setContent({ ...content, mv_requires_ack: e.target.checked })}
                  />
                }
                label='Requires SOP acknowledgement'
              />
            </div>
            {content.mv_requires_ack && (
              <CustomTextField
                fullWidth
                multiline
                label='Acknowledgement statement'
                disabled={readOnly}
                value={content.mv_ack_text}
                onChange={e => setContent({ ...content, mv_ack_text: e.target.value })}
              />
            )}
            {!readOnly && (
              <Button
                variant='contained'
                className='self-start'
                disabled={busy}
                onClick={() => save('/training/version/save', content, 'Content saved')}
              >
                Save content
              </Button>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Card>
          <CardHeader title='Audience & rules' subheader='Applies to every version immediately' />
          <CardContent className='flex flex-col gap-4'>
            <CustomTextField
              fullWidth
              label='Code'
              value={settings.tm_code || ''}
              onChange={e => setSettings({ ...settings, tm_code: e.target.value })}
            />
            <SelectField
              label='Category'
              options={categories}
              emptyLabel='None'
              value={settings.tm_category_id}
              onChange={value => setSettings({ ...settings, tm_category_id: value })}
            />
            <SelectField
              label='Language'
              options={LANGUAGES}
              value={settings.tm_language}
              onChange={value => setSettings({ ...settings, tm_language: value })}
            />
            <MultiSelectField
              label='Brands'
              options={brands}
              value={settings.tm_brand_ids}
              onChange={value => setSettings({ ...settings, tm_brand_ids: value })}
              placeholder='All brands'
            />
            <MultiSelectField
              label='Roles'
              options={roles}
              value={settings.tm_role_ids}
              onChange={value => setSettings({ ...settings, tm_role_ids: value })}
              placeholder='All roles'
            />
            <SelectField
              label='Prerequisite module'
              options={modules.filter(m => m.value !== module.tm_id)}
              emptyLabel='None'
              value={settings.tm_prerequisite_id}
              onChange={value => setSettings({ ...settings, tm_prerequisite_id: value })}
            />
            <div className='grid grid-cols-2 gap-4'>
              <CustomTextField
                type='number'
                label='Deadline (days)'
                value={settings.tm_due_days}
                onChange={e => setSettings({ ...settings, tm_due_days: Number(e.target.value) })}
              />
              <CustomTextField
                type='number'
                label='Display order'
                value={settings.tm_sequence}
                onChange={e => setSettings({ ...settings, tm_sequence: Number(e.target.value) })}
              />
            </div>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.tm_is_mandatory}
                  onChange={e => setSettings({ ...settings, tm_is_mandatory: e.target.checked })}
                />
              }
              label='Mandatory'
            />
            <Button
              variant='contained'
              className='self-start'
              disabled={busy}
              onClick={() =>
                save(
                  '/training/save',
                  {
                    tm_id: settings.tm_id,
                    tm_code: settings.tm_code,
                    tm_category_id: settings.tm_category_id,
                    tm_language: settings.tm_language,
                    tm_brand_ids: settings.tm_brand_ids,
                    tm_role_ids: settings.tm_role_ids,
                    tm_prerequisite_id: settings.tm_prerequisite_id,
                    tm_due_days: settings.tm_due_days,
                    tm_sequence: settings.tm_sequence,
                    tm_is_mandatory: settings.tm_is_mandatory
                  },
                  'Settings saved'
                )
              }
            >
              Save settings
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default DetailsTab
