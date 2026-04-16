import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/auth.service.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore user profile from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  // Listen for forced logouts (expired refresh)
  useEffect(() => {
    const handle = () => {
      localStorage.removeItem('user')
      setUser(null)
    }
    window.addEventListener('auth:logout', handle)
    return () => window.removeEventListener('auth:logout', handle)
  }, [])

  const saveSession = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const register = useCallback(async (email, password) => {
    const res = await authService.register(email, password)
    saveSession(res.data.user)
    return res.data.user
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authService.login(email, password)
    saveSession(res.data.user)
    return res.data.user
  }, [])

  const logout = useCallback(async () => {
    try { await authService.logout() } catch { /* ignore */ }
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}