const BASE_URL = (
  (import.meta as ImportMeta & {
    env?: {
      VITE_API_BASE_URL?: string
    }
  }).env?.VITE_API_BASE_URL ||
  'https://vandycareapis.vandytrust.com/v1'
).replace(/\/$/, '')

export function getToken() {
  return localStorage.getItem('admin_access_token')
}

let refreshInProgress: Promise<string | null> | null = null

export function logout() {
  localStorage.removeItem('admin_access_token')
  localStorage.removeItem('admin_refresh_token')
  localStorage.removeItem('admin_user')
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('admin_refresh_token')

  if (!refreshToken) {
    logout()
    return null
  }

  if (!refreshInProgress) {
    refreshInProgress = (async () => {
      try {
        const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: '*/*',
          },
          body: JSON.stringify({ refreshToken }),
        })

        const result = await response.json().catch(() => null)
        const data = result?.data || result
        const accessToken = data?.accessToken || result?.access_token
        const nextRefreshToken = data?.refreshToken || result?.refresh_token

        if (!response.ok || !accessToken || !nextRefreshToken) {
          throw new Error('Unable to refresh the session.')
        }

        localStorage.setItem('admin_access_token', accessToken)
        localStorage.setItem('admin_refresh_token', nextRefreshToken)
        return accessToken as string
      } catch {
        logout()
        return null
      } finally {
        refreshInProgress = null
      }
    })()
  }

  return refreshInProgress
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const sendRequest = (token: string | null) => {
    const headers = new Headers(options.headers)

    headers.set('Content-Type', 'application/json')
    headers.set('Accept', '*/*')

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    return fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    })
  }

  let response = await sendRequest(getToken())

  if (response.status === 401 && path !== '/admin/login' && path !== '/auth/refresh-token') {
    const refreshedToken = await refreshAccessToken()

    if (refreshedToken) {
      response = await sendRequest(refreshedToken)
    }
  }

  const text = await response.text()
  let body: any = null

  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = { message: text }
  }

  if (!response.ok) {
    throw new Error(
      body?.message ||
      body?.error ||
      `Request failed (${response.status})`
    )
  }

  return body as T
}

export async function adminLogin(
  email: string,
  password: string
) {
  return request<any>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  })
}

export const adminApi = {
  pendingDoctors: () =>
    request<any>('/admin/doctors/pending'),

  doctors: () =>
    request<any>('/admin/doctors'),

  doctorDetails: (id: string) =>
    request<any>(
      `/admin/doctors/${encodeURIComponent(id)}`
    ),

  approveDoctor: (id: string) =>
    request<any>(
      `/admin/doctors/${encodeURIComponent(id)}/approve`,
      {
        method: 'POST',
      }
    ),

  rejectDoctor: (
    id: string,
    reason: string
  ) =>
    request<any>(
      `/admin/doctors/${encodeURIComponent(id)}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({
          reason,
        }),
      }
    ),

  activateDoctor: (id: string) =>
    request<any>(
      `/admin/doctors/${encodeURIComponent(id)}/activate`,
      {
        method: 'POST',
      }
    ),

  deactivateDoctor: (id: string) =>
    request<any>(
      `/admin/doctors/${encodeURIComponent(id)}/deactivate`,
      {
        method: 'POST',
      }
    ),

  patients: () =>
    request<any>('/admin/patients'),

  patientDetails: (id: string) =>
    request<any>(
      `/admin/patients/${encodeURIComponent(id)}`
    ),
}