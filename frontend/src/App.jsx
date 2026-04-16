import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx'

import Login      from './pages/Login.jsx'
import Register   from './pages/Register.jsx'
import Dashboard  from './pages/Dashboard.jsx'
import EditorPage from './pages/EditorPage.jsx'
import ShareView  from './pages/ShareView.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/share/:token" element={<ShareView />} />

              {/* Protected */}
              <Route path="/" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />
              <Route path="/doc/:id" element={
                <ProtectedRoute><EditorPage /></ProtectedRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}