'use client'

// React Imports
import type { ReactNode } from 'react'

// MUI Imports
import LinearProgress from '@mui/material/LinearProgress'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

export type Column<T> = {
  key: string
  header: ReactNode
  render?: (row: T) => ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}

type Props<T> = {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  loading?: boolean
  total?: number
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onRowClick?: (row: T) => void
  emptyText?: string
}

// Table with server side pagination (API lists return { total, rows })
const ServerTable = <T,>(props: Props<T>) => {
  const {
    columns,
    rows,
    rowKey,
    loading,
    total,
    page = 0,
    pageSize = 10,
    onPageChange,
    onPageSizeChange,
    onRowClick,
    emptyText = 'No records found'
  } = props

  return (
    <>
      {loading && <LinearProgress className='bs-[2px]' />}
      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column.key} className={column.className} style={{ textAlign: column.align || 'left' }}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className='text-center'>
                  <Typography color='text.secondary' className='plb-4'>
                    {loading ? 'Loading…' : emptyText}
                  </Typography>
                </td>
              </tr>
            ) : (
              rows.map(row => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={classnames({ 'cursor-pointer hover:bg-actionHover': onRowClick })}
                >
                  {columns.map(column => (
                    <td key={column.key} className={column.className} style={{ textAlign: column.align || 'left' }}>
                      {column.render ? column.render(row) : ((row as any)[column.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {total !== undefined && onPageChange && (
        <TablePagination
          component='div'
          className='border-bs'
          count={total}
          page={page}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={(_, value) => onPageChange(value)}
          onRowsPerPageChange={e => onPageSizeChange?.(Number(e.target.value))}
        />
      )}
    </>
  )
}

export default ServerTable
