'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// --- Konfigurasi API ---
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// --- Loader Minimalis (Disesuaikan warnanya) ---
function MinimalistLoader({ color = 'bg-white' }) {
  const styleSheet = `
    @keyframes bounce-up-down {
      0%, 100% { transform: translateY(0); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
      50% { transform: translateY(-6px); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
    }
  `;
  return (
    <>
      <style>{styleSheet}</style>
      <div className="flex gap-1.5 justify-center items-center px-4 py-2">
        <div className={`w-1.5 h-1.5 rounded-full ${color}`} style={{ animation: 'bounce-up-down 1s infinite ease-in-out', animationDelay: '-0.32s' }}></div>
        <div className={`w-1.5 h-1.5 rounded-full ${color}`} style={{ animation: 'bounce-up-down 1s infinite ease-in-out', animationDelay: '-0.16s' }}></div>
        <div className={`w-1.5 h-1.5 rounded-full ${color}`} style={{ animation: 'bounce-up-down 1s infinite ease-in-out' }}></div>
      </div>
    </>
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter() // Inisialisasi Router
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Cek token saat mounting
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) router.push('/dashboardv2')
  }, [router])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      setIsLoggingIn(true)
      setIsLoading(true)
      const res = await api.post('/auth/login', { username, password })
      const { token } = res.data
      if (token) {
        localStorage.setItem('token', token)
        // Redirect menggunakan router.push setelah 2 detik
        setTimeout(() => { router.push('/dashboardv2') }, 2000)
      } else {
        setError('Token tidak ditemukan dalam response')
        setIsLoading(false); setIsLoggingIn(false)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.response?.data?.message || 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setTimeout(() => { setIsLoading(false); setIsLoggingIn(false) }, 3000)
    }
  }

  // Warna Utama diganti ke Emerald-600 (#059669) agar lebih fresh dan standar modern
  const mainColor = 'bg-emerald-600';
  const mainColorHover = 'hover:bg-emerald-700';
  const textColor = 'text-emerald-600';
  const borderColorHover = 'hover:border-emerald-600';

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 font-['Poppins',_sans-serif]">
      <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
            `}</style>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-[30px] shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row min-h-[600px]">

          {/* Sisi Kiri (Hijau - Info/Welcome) */}
          <div className={`hidden md:flex w-1/2 ${mainColor} p-12 flex-col justify-center text-white relative overflow-hidden`}>
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-32 -right-20 w-80 h-80 bg-black/5 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-6 leading-tight">おかえり FMP !</h2>
              <p className="text-green-50/90 text-lg mb-12 leading-relaxed">
                ToMa は信頼性が高く高速なトークン管理システムです。翻訳されているんですね、笑。
              </p>
              {/* <Link href="/auth/signup" className={`inline-block text-center py-3 px-12 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:${textColor} transition-all duration-300 uppercase tracking-wider text-sm`}>
                Sign Up
              </Link> */}
              <Link href="#" className={`inline-block text-center py-3 px-12 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:${textColor} transition-all duration-300 uppercase tracking-wider text-sm`}>
                サインアップ
              </Link>
            </div>
          </div>

          {/* Sisi Kanan (Putih - Form Login) */}
          <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white">
            <div className="text-center mb-10">
              {/* <h1 className={`text-3xl font-bold ${textColor} mb-2`}>Sign In to XLToken</h1> */}
              <h1 className={`text-3xl font-bold ${textColor} mb-2`}>ToMa にサインイン</h1>
              <div className="flex justify-center gap-4 mt-6">
                <div className={`w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center text-gray-400 ${borderColorHover} hover:${textColor} transition-all cursor-pointer`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.35c-.538 0-.65.221-.65.778v1.222h2l-.209 2h-1.791v7h-3v-7h-2v-2h2v-2.308c0-1.769.931-2.692 3.029-2.692 1.005 0 1.867.075 2.122.108v2.192z" /></svg>
                </div>
                <div className={`w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center text-gray-400 ${borderColorHover} hover:${textColor} transition-all cursor-pointer`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" /></svg>
                </div>
                <div className={`w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center text-gray-400 ${borderColorHover} hover:${textColor} transition-all cursor-pointer`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                </div>
              </div>
              {/* <p className="text-gray-400 text-sm mt-4">or use your account</p> */}
              <p className="text-gray-400 text-sm mt-4">またはあなたのアカウントを使用してください</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="bg-gray-100/50 flex items-center px-4 rounded-lg overflow-hidden">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                {/* <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full py-3.5 px-3 bg-transparent outline-none placeholder-gray-400 text-gray-700" required /> */}
                <input type="text" placeholder="ユーザー名" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full py-3.5 px-3 bg-transparent outline-none placeholder-gray-400 text-gray-700" required />
              </div>
              <div className="bg-gray-100/50 flex items-center px-4 rounded-lg overflow-hidden">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                {/* <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full py-3.5 px-3 bg-transparent outline-none placeholder-gray-400 text-gray-700" required /> */}
                <input type="password" placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full py-3.5 px-3 bg-transparent outline-none placeholder-gray-400 text-gray-700" required />
              </div>
              <div className="text-center mt-4">
                {/* <a href="#" className={`text-sm text-gray-500 hover:${textColor} transition-colors border-b border-dotted border-gray-400 hover:${borderColorHover}`}>Forgot your password?</a> */}
                <a href="#" className={`text-sm text-gray-500 hover:${textColor} transition-colors border-b border-dotted border-gray-400 hover:${borderColorHover}`}>パスワードをお忘れですか？</a>
              </div>
              {error && <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</div>}
              <button type="submit" disabled={isLoading} className={`w-full py-3.5 ${mainColor} text-white font-bold rounded-full ${mainColorHover} transition-all shadow-lg shadow-emerald-200/50 uppercase tracking-wider mt-6 flex justify-center items-center h-[56px]`}>
                {/* {isLoading ? <MinimalistLoader /> : 'SIGN IN'} */}
                {isLoading ? <MinimalistLoader /> : 'サインイン'}
              </button>
            </form>
            <div className="mt-8 text-center md:hidden">
              {/* <p className="text-gray-600">Don't have an account?</p> */}
              {/* <Link href="/auth/signup" className={`${textColor} font-bold hover:underline`}>Sign Up here</Link> */}
              <p className="text-gray-600">アカウントをお持ちではありませんか？</p>
              <Link href="#" className={`${textColor} font-bold hover:underline`}>ここからサインアップしてください</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer ditambahkan */}
      <footer className="w-full py-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} <span className="font-semibold text-gray-700">FMP</span> — Token Manager by Faezol.
      </footer>

      {isLoggingIn && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300">
          <div className={`${textColor} text-lg flex flex-col items-center gap-3 font-semibold`}>
            <MinimalistLoader color={mainColor} />
            Logging in ...
          </div>
        </div>
      )}
    </div>
  )
}