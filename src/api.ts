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

export function logout() {
  localStorage.removeItem('admin_access_token')
  localStorage.removeItem('admin_user')
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers)

  headers.set('Content-Type', 'application/json')
  headers.set('Accept', '*/*')

  const token = getToken()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const text = await response.text()

  let body: any = null

  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = {
      message: text,
    }
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