'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * Komponen Loader minimalis baru
 */
function MinimalistLoader({ color = 'bg-gray-800' }) {
  // Kita perlu menginjeksi keyframes untuk animasi
  const styleSheet = `
    @keyframes bounce-up-down {
      0%, 100% { 
        transform: translateY(0); 
        animation-timing-function: cubic-bezier(0.8, 0, 1, 1); 
      }
      50% { 
        transform: translateY(-10px); 
        animation-timing-function: cubic-bezier(0, 0, 0.2, 1); 
      }
    }
  `;

  return (
    <>
      <style>{styleSheet}</style> {/* Injeksi keyframes */}
      <div className="flex gap-1.5 justify-center items-center">
        <div
          className={`w-2 h-2 rounded-full ${color}`}
          style={{ animation: 'bounce-up-down 1.4s infinite ease-in-out', animationDelay: '-0.32s' }}
        ></div>
        <div
          className={`w-2 h-2 rounded-full ${color}`}
          style={{ animation: 'bounce-up-down 1.4s infinite ease-in-out', animationDelay: '-0.16s' }}
        ></div>
        <div
          className={`w-2 h-2 rounded-full ${color}`}
          style={{ animation: 'bounce-up-down 1.4s infinite ease-in-out' }}
        ></div>
      </div>
    </>
  );
}


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
                className={`w-full h-[40px] flex justify-center items-center rounded-lg text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl
                  ${isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-500'}
                `}
              >
                {isLoading ? <MinimalistLoader color="bg-white" /> : 'Login'}
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
          &copy; {new Date().getFullYear()} <span className="font-semibold text-gray-700">FMP</span> — Token Manager by Faezol.
        </p>
      </footer>
      {isLoggingIn && (
        <div className="fixed inset-0 bg-white/70 flex justify-center items-center z-50 transition-opacity duration-300">
          {/* Mengganti spinner SVG dengan MinimalistLoader */}
          <div className="text-gray-800 text-lg flex flex-col items-center gap-3">
            <MinimalistLoader color="bg-gray-700" />
            Logging in ...
          </div>
        </div>
      )}
    </div>
  )
}