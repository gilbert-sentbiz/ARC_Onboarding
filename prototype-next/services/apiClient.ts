const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

type RequestOpts = {
  token?: string | null
  signal?: AbortSignal
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  opts: RequestOpts = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    ...(init.headers as Record<string, string>),
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers, signal: opts.signal })

  if (res.status === 401) throw new ApiError(401, '인증이 필요합니다')
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.message ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string, opts?: RequestOpts) => request<T>(path, { method: 'GET' }, opts),

  post: <T>(path: string, body?: unknown, opts?: RequestOpts) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }, opts),

  put: <T>(path: string, body?: unknown, opts?: RequestOpts) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }, opts),

  postForm: <T>(path: string, formData: FormData, opts?: RequestOpts) =>
    request<T>(path, { method: 'POST', body: formData }, opts),
}
