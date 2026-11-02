'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useColorScheme } from '@mui/material/styles'

// Third-party Imports
import { toast } from 'react-toastify'
import type { ApexOptions } from 'apexcharts'

// Component Imports
import PageHeader from '@/components/PageHeader'
import ServerTable from '@/components/ServerTable'
import SelectField from '@/components/form/SelectField'
import { AssignmentChip } from '@/components/StatusChip'
import CustomAvatar from '@core/components/mui/Avatar'
import AppReactApexCharts from '@/libs/styles/AppReactApexCharts'
import { CompletionBar } from '@/views/team/TeamProgress'
import type { SummaryRow } from '@/views/team/TeamProgress'

// Hook Imports
import { useApi } from '@/hooks/useApi'
import { useOptions } from '@/hooks/useOptions'

// Lib Imports
import { downloadFile, errorMessage } from '@/libs/api'

// Type Imports
import type { AssignmentState } from '@/types/apiTypes'
import type { ThemeColor } from '@core/types'

// Util Imports
import { formatDate, fullName } from '@/utils/format'

type AssignmentRow = {
  asg_id: number
  asg_state: AssignmentState
  asg_due_at: string | null
  asg_attempts_used: number
  asg_best_score: number | null
  is_overdue: boolean
  days_overdue: number
  asg_user: {
    user_id: number
    user_employee_id: string
    user_first_name: string
    user_last_name: string
    user_outlet: { outlet_name: string } | null
  }
  asg_version: { mv_title: string; mv_version_no: number }
  assessment_attempts: { aa_attempt_no: number; aa_score: number }[]
}

type Dashboard = {
  totals: {
    learners: number
    assigned: number
    completed: number
    in_progress: number
    not_started: number
    failed: number
    overdue: number
    completion_rate: number
    avg_score: number | null
  }
  by_outlet: SummaryRow[]
  by_brand: SummaryRow[]
  by_role: SummaryRow[]
  overdue: AssignmentRow[]
  failed: AssignmentRow[]
}

const GROUP_BY = [
  { value: 'employee', label: 'Employee' },
  { value: 'outlet', label: 'Outlet' },
  { value: 'brand', label: 'Brand' },
  { value: 'role', label: 'Role' },
  { value: 'module', label: 'Module' }
]

const LISTS = [
  { value: 'overdue', label: 'Overdue', query: { overdue: '1' } },
  { value: 'failed', label: 'Failed assessments', query: { state: 'failed' } },
  { value: 'attempts', label: 'Repeated attempts', query: { min_attempts: 2 } }
]

const summaryColumns = (label: string) => [
  { key: 'name', header: label, render: (row: SummaryRow) => <Typography color='text.primary'>{row.name}</Typography> },
  { key: 'assigned', header: 'Assigned' },
  { key: 'completed', header: 'Done' },
  { key: 'overdue', header: 'Overdue' },
  { key: 'failed', header: 'Failed' },
  { key: 'rate', header: 'Completion', render: (row: SummaryRow) => <CompletionBar value={row.completion_rate} /> }
]

const assignmentColumns = [
  {
    key: 'user',
    header: 'Employee',
    render: (row: AssignmentRow) => (
      <Link href={`/team/${row.asg_user.user_id}`} className='flex flex-col'>
        <Typography color='text.primary' className='font-medium'>
          {fullName(row.asg_user)}
        </Typography>
        <Typography variant='body2'>
          {row.asg_user.user_employee_id} · {row.asg_user.user_outlet?.outlet_name || '—'}
        </Typography>
      </Link>
    )
  },
  {
    key: 'module',
    header: 'Module',
    render: (row: AssignmentRow) => `${row.asg_version.mv_title} (v${row.asg_version.mv_version_no})`
  },
  {
    key: 'state',
    header: 'Status',
    render: (row: AssignmentRow) => <AssignmentChip state={row.asg_state} overdue={row.is_overdue} />
  },
  {
    key: 'due',
    header: 'Due',
    render: (row: AssignmentRow) =>
      `${formatDate(row.asg_due_at)}${row.days_overdue ? ` (${row.days_overdue}d late)` : ''}`
  },
  {
    key: 'attempts',
    header: 'Attempt scores',
    render: (row: AssignmentRow) => row.assessment_attempts.map(a => `${a.aa_score}%`).join(' / ') || '—'
  }
]

const Reports = () => {
  // States
  const [filters, setFilters] = useState<{ brand_id: number | null; outlet_id: number | null; role_id: number | null }>(
    {
      brand_id: null,
      outlet_id: null,
      role_id: null
    }
  )

  const [groupBy, setGroupBy] = useState('employee')
  const [list, setList] = useState('overdue')

  // Hooks
  const { mode, systemMode } = useColorScheme()
  const { options: brands } = useOptions('brands')
  const { options: outlets } = useOptions('outlets')
  const { options: roles } = useOptions('roles')
  const dashboard = useApi<Dashboard>('/report/dashboard', filters)
  const completion = useApi<{ rows: SummaryRow[] }>('/report/completion', { ...filters, group_by: groupBy })
  const listConfig = LISTS.find(l => l.value === list)!

  const assignments = useApi<{ total: number; rows: AssignmentRow[] }>('/report/assignments', {
    ...filters,
    ...listConfig.query,
    limit: 50
  })

  const exportFile = async (query: Record<string, any>) => {
    try {
      await downloadFile('/report/export', { ...filters, ...query })
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const totals = dashboard.data?.totals
  const isDark = (mode === 'system' ? systemMode : mode) === 'dark'
  const outletsChart = (dashboard.data?.by_outlet || []).slice(0, 12)

  const chartOptions: ApexOptions = {
    chart: { toolbar: { show: false }, stacked: true },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '60%' } },
    colors: [
      'var(--mui-palette-success-main)',
      'var(--mui-palette-info-main)',
      'var(--mui-palette-secondary-main)',
      'var(--mui-palette-error-main)'
    ],
    dataLabels: { enabled: false },
    legend: { position: 'top', labels: { colors: 'var(--mui-palette-text-secondary)' } },
    grid: { borderColor: 'var(--mui-palette-divider)' },
    xaxis: {
      categories: outletsChart.map(o => o.name),
      labels: { style: { colors: 'var(--mui-palette-text-disabled)' } }
    },
    yaxis: { labels: { style: { colors: 'var(--mui-palette-text-secondary)' } } },
    tooltip: { theme: isDark ? 'dark' : 'light' }
  }

  const stats: { label: string; value: string | number; icon: string; color: ThemeColor }[] = totals
    ? [
        { label: 'Learners', value: totals.learners, icon: 'tabler-users', color: 'primary' },
        { label: 'Completion', value: `${totals.completion_rate}%`, icon: 'tabler-chart-pie', color: 'success' },
        { label: 'In progress', value: totals.in_progress, icon: 'tabler-progress', color: 'info' },
        { label: 'Overdue', value: totals.overdue, icon: 'tabler-alarm', color: 'warning' },
        { label: 'Failed', value: totals.failed, icon: 'tabler-refresh-alert', color: 'error' },
        {
          label: 'Avg score',
          value: totals.avg_score !== null ? `${totals.avg_score}%` : '—',
          icon: 'tabler-target',
          color: 'secondary'
        }
      ]
    : []

  return (
    <>
      <PageHeader
        title='Reports'
        subtitle='Completion, overdue training, failed assessments and repeated attempts for the people you manage'
      />
      <Card className='mbe-6'>
        <CardContent className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <SelectField
            label=''
            options={brands}
            emptyLabel='All brands'
            value={filters.brand_id}
            onChange={brand_id => setFilters({ ...filters, brand_id })}
          />
          <SelectField
            label=''
            options={outlets}
            emptyLabel='All outlets'
            value={filters.outlet_id}
            onChange={outlet_id => setFilters({ ...filters, outlet_id })}
          />
          <SelectField
            label=''
            options={roles}
            emptyLabel='All roles'
            value={filters.role_id}
            onChange={role_id => setFilters({ ...filters, role_id })}
          />
        </CardContent>
      </Card>

      {dashboard.loading && <LinearProgress className='mbe-4' />}

      <Grid container spacing={6}>
        {stats.map(stat => (
          <Grid key={stat.label} size={{ xs: 6, sm: 4, md: 2 }}>
            <Card>
              <CardContent className='flex flex-col gap-2'>
                <CustomAvatar skin='light' variant='rounded' color={stat.color}>
                  <i className={stat.icon} />
                </CustomAvatar>
                <Typography variant='h4'>{stat.value}</Typography>
                <Typography color='text.secondary'>{stat.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid size={{ xs: 12, lg: 7 }}>
          <Card className='bs-full'>
            <CardHeader title='Completion by outlet' />
            <CardContent>
              {outletsChart.length ? (
                <AppReactApexCharts
                  type='bar'
                  height={Math.max(220, outletsChart.length * 44)}
                  options={chartOptions}
                  series={[
                    { name: 'Completed', data: outletsChart.map(o => o.completed) },
                    { name: 'In progress', data: outletsChart.map(o => o.in_progress) },
                    { name: 'Not started', data: outletsChart.map(o => o.not_started) },
                    { name: 'Failed', data: outletsChart.map(o => o.failed) }
                  ]}
                />
              ) : (
                <Typography color='text.secondary'>No assignments yet</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }} className='flex flex-col gap-6'>
          <Card>
            <CardHeader title='By brand' />
            <ServerTable
              rows={dashboard.data?.by_brand || []}
              rowKey={row => row.key}
              columns={summaryColumns('Brand')}
            />
          </Card>
          <Card>
            <CardHeader title='By role' />
            <ServerTable
              rows={dashboard.data?.by_role || []}
              rowKey={row => row.key}
              columns={summaryColumns('Role')}
            />
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader
              title='Needs attention'
              action={
                <Button
                  variant='tonal'
                  size='small'
                  startIcon={<i className='tabler-file-spreadsheet' />}
                  onClick={() => exportFile({ report: 'assignments', format: 'xlsx', ...listConfig.query })}
                >
                  Export
                </Button>
              }
            />
            <Tabs value={list} onChange={(_, value) => setList(value)} className='pli-6'>
              {LISTS.map(l => (
                <Tab key={l.value} value={l.value} label={l.label} />
              ))}
            </Tabs>
            <ServerTable
              loading={assignments.loading}
              rows={assignments.data?.rows || []}
              rowKey={row => row.asg_id}
              columns={assignmentColumns}
              emptyText='Nothing here'
            />
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader
              title='Completion report'
              action={
                <div className='flex gap-2'>
                  <Button
                    variant='tonal'
                    size='small'
                    startIcon={<i className='tabler-file-spreadsheet' />}
                    onClick={() => exportFile({ report: 'completion', group_by: groupBy, format: 'xlsx' })}
                  >
                    Excel
                  </Button>
                  <Button
                    variant='tonal'
                    size='small'
                    startIcon={<i className='tabler-file-text' />}
                    onClick={() => exportFile({ report: 'completion', group_by: groupBy, format: 'csv' })}
                  >
                    CSV
                  </Button>
                </div>
              }
            />
            <CardContent>
              <SelectField
                className='max-is-[240px]'
                label='Group by'
                options={GROUP_BY}
                value={groupBy}
                onChange={setGroupBy}
              />
            </CardContent>
            <ServerTable
              loading={completion.loading}
              rows={completion.data?.rows || []}
              rowKey={row => `${groupBy}-${row.key}`}
              columns={[
                {
                  key: 'name',
                  header: GROUP_BY.find(g => g.value === groupBy)?.label,
                  render: row =>
                    groupBy === 'employee' ? (
                      <Link href={`/team/${row.key}`} className='flex flex-col'>
                        <Typography color='text.primary' className='font-medium'>
                          {row.name}
                        </Typography>
                        <Typography variant='body2'>
                          {row.employee_id} · {row.outlet || '—'}
                        </Typography>
                      </Link>
                    ) : (
                      <Typography color='text.primary'>{row.name}</Typography>
                    )
                },
                { key: 'assigned', header: 'Assigned' },
                { key: 'completed', header: 'Done' },
                { key: 'in_progress', header: 'In progress' },
                { key: 'not_started', header: 'Not started' },
                { key: 'overdue', header: 'Overdue' },
                { key: 'failed', header: 'Failed' },
                { key: 'rate', header: 'Completion', render: row => <CompletionBar value={row.completion_rate} /> },
                { key: 'avg', header: 'Avg score', render: row => (row.avg_score !== null ? `${row.avg_score}%` : '—') }
              ]}
            />
          </Card>
        </Grid>
      </Grid>
    </>
  )
}

export default Reports
