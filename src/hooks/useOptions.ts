'use client'

// React Imports
import { useEffect, useState } from 'react'

// Lib Imports
import { api } from '@/libs/api'

// Type Imports
import type { Option } from '@/types/apiTypes'

type Source = 'brands' | 'outlets' | 'roles' | 'categories' | 'paths' | 'training-modules' | 'users' | 'modules'

const mappers: Record<Source, (row: any) => Option> = {
  brands: row => ({ value: row.brand_id, label: row.brand_name }),
  outlets: row => ({ value: row.outlet_id, label: `${row.outlet_name} (${row.outlet_code})` }),
  roles: row => ({ value: row.role_id, label: row.role_name }),
  categories: row => ({ value: row.cat_id, label: row.cat_name }),
  paths: row => ({ value: row.tp_id, label: row.tp_name }),
  'training-modules': row => ({ value: row.tm_id, label: `${row.title}${row.tm_code ? ` (${row.tm_code})` : ''}` }),
  users: row => ({
    value: row.user_id,
    label: `${row.user_first_name} ${row.user_last_name} (${row.user_employee_id})`
  }),
  modules: row => ({ value: row.module_id, label: row.module_name })
}

// Dropdown options from /master/*
export const useOptions = (source: Source, query?: Record<string, any>) => {
  const [options, setOptions] = useState<Option[]>([])
  const [rows, setRows] = useState<any[]>([])
  const queryKey = JSON.stringify(query || {})

  useEffect(() => {
    let active = true

    api
      .get<any[]>(`/master/${source}`, JSON.parse(queryKey))
      .then(res => {
        if (active) {
          setRows(res.data)
          setOptions(res.data.map(mappers[source]))
        }
      })
      .catch(() => active && setOptions([]))

    return () => {
      active = false
    }
  }, [source, queryKey])

  return { options, rows }
}
