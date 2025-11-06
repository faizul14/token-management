'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [isLoggingIn, setIsLoggingIn] = useState(false)


  // Cek token, kalau sudah ada, langsung redirect
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      router.push('/dashboard')
    }
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      setIsLoggingIn(true)
      setIsLoading(true)

      const res = await api.post('/auth/login', {
        username,
        password
      })

      const { token } = res.data

      if (token) {
        localStorage.setItem('token', token)
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setError('Token tidak ditemukan dalam response')
      }

    } catch (err) {
      console.error('Login error:', err)
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError('Terjadi kesalahan. Coba lagi.')
      }
    } finally {
      setTimeout(() => {
        setIsLoggingIn(false)
        setIsLoading(false)
      }, 3000)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-800">
      <div className="flex flex-grow items-center justify-center p-4">
        <div className="w-full max-w-md relative">
          <div className="absolute inset-0 bg-gray-700/30 rounded-3xl shadow-2xl border border-gray-600/30"></div>

          <div className="relative p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6 sm:mb-8">
              Login ke FMP
            </h1>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full py-2.5 px-4 bg-gray-700/20 text-white border border-gray-600/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400/30"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-2.5 px-4 bg-gray-700/20 text-white border border-gray-600/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400/30"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 rounded-lg text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl
                  ${isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-500'}
                `}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>

              {error && (
                <div className="bg-gray-700/30 border border-gray-600/30 p-3 rounded-lg text-red-400 text-sm text-center">
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      <footer className="w-full py-6 text-center text-sm text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} <span className="font-semibold text-gray-700">FMP</span> — Personal File Manager by Faezol.
        </p>
      </footer>
      {isLoggingIn && (
        <div className="fixed inset-0 bg-white/70 flex justify-center items-center z-50 transition-opacity duration-300">
          <div className="text-gray-800 text-lg flex items-center gap-2">
            <svg
              className="w-6 h-6 animate-spin text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 018 8h-4l3 3 3-3h-4a8 8 0 01-8 8v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
              ></path>
            </svg>
            Logging in ...
          </div>
        </div>
      )}
    </div>
  )
}
