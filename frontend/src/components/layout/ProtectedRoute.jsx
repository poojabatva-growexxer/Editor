import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-black dark:border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}
