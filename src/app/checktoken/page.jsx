'use client'
import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

// Konfigurasi API
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL,
    timeout: 30000,
    headers: { 'Accept': '*/*' }
})

// Loader Minimalis (Disesuaikan warnanya nanti di penggunaan)
function MinimalistLoader({ color = 'bg-emerald-600' }) {
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

/**
 * Komponen Card Hasil Pengecekan (Disesuaikan dengan gaya Dashboard V2)
 */
function TokenInfoCard({ token }) {
    const isActive = token.isactive;
    const isExpired = new Date(token.expiredAt) < new Date();
    const now = new Date();
    const diffTime = new Date(token.expiredAt).getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let statusBadge;
    if (!isActive) {
        statusBadge = <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-red-100 text-red-800">REVOKED</span>;
    } else if (isExpired) {
        statusBadge = <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-orange-100 text-orange-800">EXPIRED</span>;
    } else {
        statusBadge = <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-green-100 text-green-800">ACTIVE</span>;
    }

    return (
        <div className="w-full bg-white rounded-3xl p-6 mt-8 border border-gray-200 shadow-lg animate-fade-in-up">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{token.username}</h3>
                    <p className="text-sm text-gray-500 mt-1">Token Checker Result</p>
                </div>
                {statusBadge}
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-6">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Token Value</p>
                <div className="flex items-center justify-between gap-3">
                    <code className="text-sm text-gray-800 truncate font-mono flex-1 font-medium bg-white p-2 rounded-lg border border-gray-100">
                        {token.token}
                    </code>
                    <button onClick={() => navigator.clipboard.writeText(token.token)} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors" title="Copy Token">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-emerald-800 font-medium mb-1">Sisa Waktu</p>
                    <p className={`text-2xl font-bold ${diffDays <= 7 ? 'text-orange-600' : 'text-emerald-600'}`}>
                        {isActive && !isExpired ? `${diffDays} Hari` : '-'}
                    </p>
                </div>
                <div className="space-y-3 py-2">
                    <div>
                        <p className="text-gray-500 text-xs">Dibuat Pada</p>
                        <p className="font-medium text-gray-900">
                            {new Date(token.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">Kadaluwarsa</p>
                        <p className="font-medium text-gray-900">
                            {new Date(token.expiredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
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

    const mainColor = 'bg-emerald-600';
    const mainColorHover = 'hover:bg-emerald-700';
    const textColor = 'text-emerald-600';
    const borderColorHover = 'hover:border-emerald-600';

    const handleCheckToken = async (e) => {
        e.preventDefault()
        if (!tokenInput) return setError('Silakan masukkan token terlebih dahulu')
        setIsLoading(true); setError(null); setMessage(''); setTokenData(null)

        try {
            const response = await api.post('/api/public/xltoken/publicchecktoken', { token: tokenInput })
            const tokenInfo = response.data.data || response.data;
            if (tokenInfo && tokenInfo.username && tokenInfo.expiredAt) {
                setTokenData(tokenInfo); setMessage(response.data.message || 'Token berhasil ditemukan.')
            } else {
                setError(response.data.message || 'Token valid, tapi data tidak lengkap.')
            }
        } catch (err) {
            setError(`Pengecekan gagal: ${err.response?.data?.message || err.message || 'Terjadi kesalahan'}`)
        } finally { setIsLoading(false) }
    }

    return (
        <div className="min-h-screen w-full flex flex-col bg-gray-50 font-['Poppins',_sans-serif]">
            <style jsx global>{`
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
            @keyframes fade-in-up {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-up { animation: fade-in-up 0.5s ease-out; }
        `}</style>

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-[30px] shadow-2xl p-8 sm:p-10 relative overflow-hidden">
                        {/* Hiasan Background */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="text-center mb-8">
                                <h1 className={`text-3xl font-bold ${textColor} mb-2`}>Cek Status Token</h1>
                                <p className="text-gray-500">Masukkan token Anda untuk melihat detail status dan masa aktifnya.</p>
                            </div>

                            <form onSubmit={handleCheckToken} className="space-y-4">
                                <div className="bg-gray-50 flex items-center px-4 rounded-2xl border-2 border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all overflow-hidden">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                    <input
                                        type="text"
                                        placeholder="Tempel token di sini..."
                                        value={tokenInput}
                                        onChange={(e) => setTokenInput(e.target.value)}
                                        className="w-full py-4 px-3 bg-transparent outline-none placeholder-gray-400 text-gray-700 font-medium"
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="flex flex-col gap-3 pt-2">
                                    <button type="submit" disabled={isLoading} className={`w-full py-4 ${mainColor} text-white font-bold rounded-full ${mainColorHover} transition-all shadow-lg shadow-emerald-200/50 uppercase tracking-wider flex justify-center items-center`}>
                                        {isLoading ? <MinimalistLoader color="bg-white" /> : 'PERIKSA SEKARANG'}
                                    </button>
                                    <button type="button" onClick={() => router.push('/dashboardv2')} className="w-full py-4 bg-white text-gray-700 font-bold rounded-full hover:bg-gray-50 border-2 border-gray-200 transition-all uppercase tracking-wider">
                                        Kembali ke Dashboard
                                    </button>
                                </div>
                            </form>

                            {/* Area Hasil */}
                            <div className="mt-2">
                                {error && (
                                    <div className="p-4 mt-6 bg-red-50 rounded-2xl border border-red-100 text-red-600 text-center text-sm font-medium animate-fade-in-up">
                                        {error}
                                    </div>
                                )}
                                {message && !error && !tokenData && (
                                    <div className="p-4 mt-6 bg-blue-50 rounded-2xl border border-blue-100 text-blue-600 text-center text-sm font-medium animate-fade-in-up">
                                        {message}
                                    </div>
                                )}
                                {tokenData && <TokenInfoCard token={tokenData} />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="w-full py-6 text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} <span className="font-semibold text-gray-700">FMP</span> — Token Manager by Faezol.
            </footer>
        </div>
    )
}