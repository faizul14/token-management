'use client'
import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

// Konfigurasi API, sama seperti yang Anda berikan
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  timeout: 30000,
  headers: {
    'Accept': '*/*',
  }
})

// Interceptor untuk menyertakan token (jika ada)
// Catatan: Ini adalah token auth dashboard, bukan token yang dicek
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Bearer'] = token
    }
    return config
  },
  (error) => Promise.reject(error)
)

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


/**
 * Komponen Card untuk menampilkan hasil pengecekan token.
 * Dibuat agar mirip dengan card di dashboard, tapi untuk mode gelap.
 */
function TokenInfoCard({ token }) {
  const isActive = token.isactive;
  const statusClass = isActive
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800';
  const expiryDate = new Date(token.expiredAt);
  const now = new Date();

  // Kalkulasi sisa hari
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = diffDays <= 0;

  let daysLeftText;
  let daysLeftClass = "font-bold ";

  if (!isActive) {
    daysLeftText = "Revoked";
    daysLeftClass += "text-red-400";
  } else if (isExpired) {
    daysLeftText = "Expired";
    daysLeftClass += "text-red-400";
  } else {
    daysLeftText = `${diffDays} hari lagi`;
    daysLeftClass += diffDays <= 7 ? "text-yellow-400" : "text-green-400";
  }

  return (
    <div className="w-full bg-gray-700/30 rounded-2xl p-5 sm:p-6 mt-6 border border-gray-600/30">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-white break-all pr-16">{token.username}</h3>
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusClass}`}>
          {isActive ? 'Active' : 'Revoked'}
        </span>
      </div>

      {/* Sisa Hari */}
      <div className="mb-4">
        <p className="text-sm text-gray-300">Masa Aktif Tersisa:</p>
        <p className={`text-2xl ${daysLeftClass}`}>{daysLeftText}</p>
      </div>

      <hr className="border-gray-600/50 my-4" />

      {/* Info Token */}
      <div className="mb-4 space-y-2">
        <p className="text-sm text-gray-300">Token:</p>
        <pre className="text-xs text-gray-200 bg-gray-800/60 p-3 rounded-md break-all overflow-x-auto">
          {token.token}
        </pre>
      </div>

      {/* Info Tanggal */}
      <div className="text-sm text-gray-400 space-y-1">
        <p>
          Dibuat: {new Date(token.createdAt).toLocaleDateString('id-ID', {
            year: 'numeric', month: 'long', day: 'numeric'
          })}
        </p>
        <p>
          Kadaluwarsa: {expiryDate.toLocaleDateString('id-ID', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  );
}


export default function CheckTokenPage() {
  const [tokenInput, setTokenInput] = useState('')
  const [tokenData, setTokenData] = useState(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()
  // Hapus `router.push('/dashboard')` dari sini

  const handleCheckToken = async (e) => {
    e.preventDefault()
    if (!tokenInput) {
      setError('Silakan masukkan token terlebih dahulu')
      return
    }

    setIsLoading(true)
    setError(null)
    setMessage('')
    setTokenData(null) // Reset data sebelumnya

    try {
      console.log('Checking token...', tokenInput)

      // Panggil endpoint yang Anda tentukan
      const response = await api.post('/api/public/xltoken/publicchecktoken', {
        token: tokenInput
      })

      console.log('Check response:', response.data)

      // Asumsi: response.data adalah objek token lengkap
      // Jika endpoint mengembalikan { message: "...", data: {...} }, ganti response.data menjadi response.data.data
      const tokenInfo = response.data.data || response.data; // Fleksibel, mencoba .data dulu

      if (tokenInfo && tokenInfo.username && tokenInfo.expiredAt) {
        setTokenData(tokenInfo)
        setMessage(response.data.message || 'Token berhasil ditemukan.')
      } else if (response.data.isactive === false) {
        // Handle jika token ditemukan tapi tidak aktif (sesuai doc)
        setError(response.data.message || 'Token ditemukan tapi tidak aktif.')
      } else if (response.data.isactive === true) {
        // Handle jika doc checktoken diikuti, tapi data token tidak ada
        setError('Token valid, tapi data lengkap tidak diterima. (API Response tidak lengkap)')
        setMessage(response.data.message)
      } else {
        setError(response.data.message || 'Token valid, tapi data tidak lengkap.')
      }

    } catch (err) {
      console.error('Check error:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Terjadi kesalahan'
      setError(`Pengecekan gagal: ${errorMessage}`)
      setTokenData(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-800">
        <div className="flex flex-grow bg-gray-800  items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="relative">
              {/* Glass effect background */}
              <div className="absolute inset-0 bg-gray-700/30  rounded-3xl shadow-2xl border border-gray-600/30"></div>

              {/* Content */}
              <div className="relative p-6 sm:p-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6 sm:mb-8">
                  Cek Status Token
                </h1>

                <form onSubmit={handleCheckToken} className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Masukkan token di sini..."
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        className="w-full py-2.5 px-4 bg-gray-700/20 text-white border border-gray-600/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400/30"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:gap-4">
                    <button
                      type="submit"
                      className={`w-full py-2 sm:py-3 px-4 rounded-lg text-white font-medium
                                    ${isLoading
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-gray-600 hover:bg-gray-500'
                        }
                                    transition-all duration-200 shadow-lg hover:shadow-xl`}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Checking...' : 'Check Token'}
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push('/dashboard')}
                      className="w-full py-2 sm:py-3 px-4 rounded-lg text-white 
                                    hover:text-white/90 font-medium
                                    bg-gray-700/30 hover:bg-gray-700/50
                                    transition-all duration-200
                                    border border-gray-600/30"
                    >
                      Kembali ke Dashboard
                    </button>
                  </div>

                  {/* Area Hasil */}
                  <div className="pt-4">
                    {isLoading && (
                      <div className="flex justify-center items-center py-2">
                        <MinimalistLoader color="bg-white" />
                      </div>
                    )}

                    {error && (
                      <div className="p-3 sm:p-4 bg-red-800/30 rounded-lg border border-red-600/30">
                        <p className="text-red-300 text-sm text-center">{error}</p>
                      </div>
                    )}

                    {message && !error && !tokenData && (
                      <div className="p-3 sm:p-4 bg-blue-800/30 rounded-lg border border-blue-600/30">
                        <p className="text-blue-300 text-sm text-center">{message}</p>
                      </div>
                    )}

                    {/* Tampilkan Card jika data token ada */}
                    {tokenData && <TokenInfoCard token={tokenData} />}
                  </div>

                </form>
              </div>
            </div>
          </div>
        </div>
        <footer className="w-full mt-0 py-6 text-center text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} <span className="font-semibold text-gray-700">FMP</span> — Token Manager by Faezol.
          </p>
        </footer>

      </div>
    </>
  )
}