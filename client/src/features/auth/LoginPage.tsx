import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../shared/utils/api'
import { useAuthStore } from '../../store/auth.store'
import type { User } from '../../shared/types'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/auth/login', { email, password })
      setAuth(data.user as User, data.accessToken, data.refreshToken)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al iniciar sesión'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-[#1F211F] px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Título */}
        <div className="text-center mb-8">
          <h1 className="font-sans text-3xl font-bold text-[#E0E1E3] tracking-tight">
            GFE Chord
          </h1>
          <p className="text-[#B1B3B1] mt-2 text-sm">
            Cancionero de la iglesia
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#2a2d2a] border border-[#353835] rounded-2xl p-8">
          <h2 className="font-sans text-lg font-semibold text-[#E0E1E3] mb-6">
            Iniciar sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#B1B3B1] mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#353835] border border-[#454845] rounded-lg px-4 py-2.5
                           text-[#E0E1E3] placeholder-[#B1B3B1] text-sm
                           focus:outline-none focus:border-[#515486] focus:ring-1 focus:ring-[#515486]
                           transition-colors"
                placeholder="correo@iglesia.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#B1B3B1] mb-1.5"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#353835] border border-[#454845] rounded-lg px-4 py-2.5
                           text-[#E0E1E3] placeholder-[#B1B3B1] text-sm
                           focus:outline-none focus:border-[#515486] focus:ring-1 focus:ring-[#515486]
                           transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#754456] hover:bg-[#8a5267] disabled:opacity-50
                         text-[#E0E1E3] font-semibold rounded-lg py-2.5 mt-2
                         transition-colors cursor-pointer
                         min-h-[44px] text-sm"
            >
              {loading ? 'Iniciando sesión...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
