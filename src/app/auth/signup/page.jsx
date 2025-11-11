'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation' // Import useRouter

// --- Loader Minimalis ---
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

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter() // Inisialisasi router

  const handleSignupPrototype = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulasi loading 2 detik, lalu redirect ke login menggunakan router.push
    setTimeout(() => {
      setIsLoading(false);
      alert("Fitur Sign Up belum tersedia (Prototype Mode). Mengarahkan ke Login...");
      router.push('/auth/loginv2'); // Gunakan router untuk redirect
    }, 2000);
  }

  // Menggunakan warna yang sama dengan Login V2 (Emerald-600)
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

          {/* Sisi Kiri (Putih - Form Sign Up) */}
          <div className="w-full md:w-3/5 p-8 sm:p-12 flex flex-col justify-center bg-white order-2 md:order-1">
            <div className="text-center mb-8">
              <h1 className={`text-3xl font-bold ${textColor}`}>Create Account</h1>
              <div className="flex justify-center gap-4 mt-4 mb-6">
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
              <p className="text-gray-400 text-sm">or use your email for registration</p>
            </div>

            <form onSubmit={handleSignupPrototype} className="space-y-3">
              <div className="bg-gray-100/50 flex items-center px-4 rounded-lg overflow-hidden">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <input type="text" placeholder="Name" className="w-full py-3 px-3 bg-transparent outline-none placeholder-gray-400 text-gray-700" />
              </div>
              <div className="bg-gray-100/50 flex items-center px-4 rounded-lg overflow-hidden">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <input type="email" placeholder="Email" className="w-full py-3 px-3 bg-transparent outline-none placeholder-gray-400 text-gray-700" />
              </div>
              <div className="bg-gray-100/50 flex items-center px-4 rounded-lg overflow-hidden">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <input type="password" placeholder="Password" className="w-full py-3 px-3 bg-transparent outline-none placeholder-gray-400 text-gray-700" />
              </div>

              <button type="submit" disabled={isLoading} className={`w-full py-3.5 ${mainColor} text-white font-bold rounded-full ${mainColorHover} transition-all shadow-lg shadow-emerald-200/50 uppercase tracking-wider mt-6 flex justify-center items-center h-[56px]`}>
                {isLoading ? <MinimalistLoader /> : 'SIGN UP'}
              </button>
            </form>
            <div className="mt-6 text-center md:hidden">
              <p className="text-gray-600">Already have an account?</p>
              <Link href="/auth/loginv2" className={`${textColor} font-bold hover:underline`}>Sign In here</Link>
            </div>
          </div>

          {/* Sisi Kanan (Hijau - Welcome Back) */}
          <div className={`hidden md:flex w-2/5 ${mainColor} p-12 flex-col justify-center text-white relative overflow-hidden order-1 md:order-2 items-center text-center`}>
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -top-32 -right-20 w-80 h-80 bg-black/5 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-6 leading-tight">Welcome Back!</h2>
              <p className="text-green-50/90 text-lg mb-12 leading-relaxed">
                To keep connected with us please login with your personal info.
              </p>
              <Link href="/auth/loginv2" className={`inline-block text-center py-3 px-12 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:${textColor} transition-all duration-300 uppercase tracking-wider text-sm`}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer ditambahkan */}
      <footer className="w-full py-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} <span className="font-semibold text-gray-700">FMP</span> — Token Manager by Faezol.
      </footer>
    </div>
  )
}