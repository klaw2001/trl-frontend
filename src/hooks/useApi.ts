'use client'

// React Imports
import { useCallback, useEffect, useRef, useState } from 'react'

// Lib Imports
import type { ApiError } from '@/libs/api'
import { api } from '@/libs/api'

type State<T> = {
  data: T | null
  loading: boolean
  error: ApiError | null
}

// GET request bound to a component; refetches when path or query change
export const useApi = <T = any>(path: string | null, query?: Record<string, any>) => {
  const [state, setState] = useState<State<T>>({ data: null, loading: Boolean(path), error: null })
  const queryKey = JSON.stringify(query || {})
  const requestId = useRef(0)

  const load = useCallback(async () => {
    if (!path) {
      return
    }

    const id = ++requestId.current

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const res = await api.get<T>(path, JSON.parse(queryKey))

      if (id === requestId.current) {
        setState({ data: res.data, loading: false, error: null })
      }
    } catch (error) {
      if (id === requestId.current) {
        setState({ data: null, loading: false, error: error as ApiError })
      }
    }
  }, [path, queryKey])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, reload: load, setData: (data: T | null) => setState(prev => ({ ...prev, data })) }
}
