'use client'

// Thin client for the Express API. Every response is { status, data, message }.
// Access tokens are refreshed transparently; revoked sessions are sent back to the login page.

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8020/api'

const ACCESS_KEY = 'trl_access_token'
const REFRESH_KEY = 'trl_refresh_token'

export type ApiResponse<T = any> = {
  status: boolean
  data: T
  message: string
}

export class ApiError extends Error {
  status: number
  code?: string
  data: any

  constructor(message: string, status: number, data: any) {
    super(message)
    this.status = status
    this.data = data
    this.code = data?.code
  }
}

export const tokenStore = {
  get access() {
    return typeof window === 'undefined' ? null : localStorage.getItem(ACCESS_KEY)
  },
  get refresh() {
    return typeof window === 'undefined' ? null : localStorage.getItem(REFRESH_KEY)
  },
  set(access: string, refresh?: string) {
    localStorage.setItem(ACCESS_KEY, access)

    if (refresh) {
      localStorage.setItem(REFRESH_KEY, refresh)
    }
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  }
}

// Codes that end the session immediately (access removed by an admin, logged out elsewhere)
const SESSION_END_CODES = ['ACCOUNT_DISABLED', 'SESSION_REVOKED']

let refreshing: Promise<boolean> | null = null

async function refreshAccessToken() {
  const refreshToken = tokenStore.refresh

  if (!refreshToken) {
    return false
  }

  refreshing =
    refreshing ||
    fetch(`${API_URL}/auth/access-token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    })
      .then(async res => {
        const body = (await res.json()) as ApiResponse<{ access_token: string }>

        if (body.status && body.data?.access_token) {
          tokenStore.set(body.data.access_token)

          return true
        }

        return false
      })
      .catch(() => false)
      .finally(() => {
        refreshing = null
      })

  return refreshing
}

function endSession(reason: string) {
  tokenStore.clear()

  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = `/login?reason=${reason}`
  }
}

type RequestOptions = {
  query?: Record<string, any>
  body?: any
  retry?: boolean
}

function buildUrl(path: string, query?: Record<string, any>) {
  const url = new URL(`${API_URL}${path}`)

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  return url.toString()
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers: Record<string, string> = {}

  if (!isForm && options.body !== undefined) {
    headers['content-type'] = 'application/json'
  }

  if (tokenStore.access) {
    headers.authorization = `Bearer ${tokenStore.access}`
  }

  const res = await fetch(buildUrl(path, options.query), {
    method,
    headers,
    body: options.body === undefined ? undefined : isForm ? options.body : JSON.stringify(options.body)
  })

  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null
  const code = (body?.data as any)?.code as string | undefined

  if (res.status === 401 && code === 'TOKEN_INVALID' && options.retry !== false) {
    if (await refreshAccessToken()) {
      return request<T>(method, path, { ...options, retry: false })
    }

    endSession('expired')
  }

  if (res.status === 401 && code && SESSION_END_CODES.includes(code)) {
    endSession(code === 'ACCOUNT_DISABLED' ? 'disabled' : 'revoked')
  }

  if (res.status === 403 && code === 'PASSWORD_CHANGE_REQUIRED' && typeof window !== 'undefined') {
    window.location.href = '/change-password'
  }

  if (!body || !body.status) {
    throw new ApiError(body?.message || 'Something went wrong', res.status, body?.data)
  }

  return body
}

export const api = {
  get: <T = any>(path: string, query?: Record<string, any>) => request<T>('GET', path, { query }),
  post: <T = any>(path: string, body?: any) => request<T>('POST', path, { body: body ?? {} }),
  upload: <T = any>(path: string, form: FormData) => request<T>('POST', path, { body: form })
}

// Downloads a report export (CSV / XLSX) with the auth header
export async function downloadFile(path: string, query: Record<string, any>) {
  let res = await fetch(buildUrl(path, query), { headers: { authorization: `Bearer ${tokenStore.access}` } })

  if (res.status === 401 && (await refreshAccessToken())) {
    res = await fetch(buildUrl(path, query), { headers: { authorization: `Bearer ${tokenStore.access}` } })
  }

  if (!res.ok) {
    throw new ApiError('Export failed', res.status, null)
  }

  const disposition = res.headers.get('content-disposition') || ''
  const fileName = disposition.match(/filename="(.+)"/)?.[1] || 'export'
  const blob = await res.blob()
  const link = document.createElement('a')

  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  URL.revokeObjectURL(link.href)
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong'
}
