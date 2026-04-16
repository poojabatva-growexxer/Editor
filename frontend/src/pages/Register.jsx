import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Input } from '../components/ui/Input.jsx'
import { validateEmail, validatePassword } from '../utils/helpers.js'

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const toast        = useToast()

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!validateEmail(form.email))             e.email    = 'Enter a valid email'
    const pwErr = validatePassword(form.password)
    if (pwErr)                                  e.password = pwErr
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register(form.email, form.password)
      navigate('/')
    } catch (err) {
      if (err.status === 409) toast('An account with this email already exists', 'error')
      else toast(err.message || 'Registration failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <span className="text-2xl font-bold tracking-tight text-black dark:text-white">Docs</span>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Create your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              autoComplete="email"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Password
              <span className="ml-1 text-gray-400 font-normal">(min 8 chars, 1 number)</span>
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              autoComplete="new-password"
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-black dark:text-white hover:underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}