const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

async function request(path, options = {}, retries = 2) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    // Auto-refresh on 401
    if (res.status === 401 && path !== '/auth/refresh') {
      const refreshed = await tryRefresh()
      if (refreshed) {
        const retry = await fetch(`${BASE_URL}${path}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        })
        return handleResponse(retry)
      }
      // Refresh failed — wipe tokens and let AuthContext handle redirect
      window.dispatchEvent(new Event('auth:logout'))
      throw new Error('Session expired')
    }

    return handleResponse(res)
  } catch (error) {
    if (retries > 0 && (error.name === 'TypeError' || (error.status >= 500 && error.status < 600))) {
      // Retry on network errors or 5xx
      await new Promise(resolve => setTimeout(resolve, 1000))
      return request(path, options, retries - 1)
    }
    throw error
  }
}

async function handleResponse(res) {
  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data?.error || 'Request failed')
    err.status = res.status
    throw err
  }
  return data
}

async function tryRefresh() {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    return res.ok
  } catch {
    return false
  }
}

export const api = {
  get:    (path, opts)   => request(path, { method: 'GET',    ...opts }),
  post:   (path, body)   => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  (path, body)   => request(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (path)         => request(path, { method: 'DELETE' }),
}