'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

// --- Konfigurasi API ---
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000',
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
})

// Interceptor Response & Request
api.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) config.headers['Bearer'] = token
        return config
    },
    (error) => Promise.reject(error)
)

// --- Fungsi Helper untuk Decode JWT ---
function getPayloadFromToken(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// --- Komponen UI Pendukung ---

function MinimalistLoader({ color = 'bg-gray-800' }) {
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

// Kartu Statistik Dashboard
function StatCard({ title, value, subValue, icon, bgColor = 'bg-white', textColor = 'text-gray-900' }) {
    return (
        <div className={`${bgColor} p-6 rounded-3xl shadow-md border border-gray-200/60 flex flex-col justify-between min-h-[160px] transition-all hover:shadow-lg`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className={`text-sm font-semibold mb-1 ${bgColor === 'bg-white' ? 'text-gray-600' : 'text-white/90'}`}>{title}</h3>
                    <p className={`text-4xl font-bold ${textColor}`}>{value}</p>
                </div>
                <div className={`p-3 rounded-full ${bgColor === 'bg-white' ? 'bg-gray-50' : 'bg-white/20'}`}>
                    {icon}
                </div>
            </div>
            {subValue && (
                <div className="text-sm mt-4 font-medium">
                    {subValue}
                </div>
            )}
        </div>
    )
}

// Item Daftar Token
function TokenListItem({ token, onAction, actionLabel, actionColor, showRevokedStatus = false }) {
    const isExpired = new Date(token.expiredAt) < new Date();
    const limitExhausted = token.transactionslimit <= 0;

    return (
        <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group border-b border-gray-100 last:border-0">
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{token.username}</h4>

                    {/* Badge Status */}
                    {showRevokedStatus && !token.isactive && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold tracking-wide">REVOKED</span>
                    )}
                    {isExpired && token.isactive && (
                        <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold tracking-wide">EXPIRED</span>
                    )}
                    {!isExpired && token.isactive && limitExhausted && (
                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold tracking-wide">LIMIT 0</span>
                    )}
                </div>
                <p className="text-xs text-gray-600 truncate mt-1 font-mono opacity-80 group-hover:opacity-100 transition-opacity">
                    {token.token.substring(0, 20)}...
                </p>
                <div className="flex gap-3 mt-1">
                    <p className="text-[11px] text-gray-500 font-medium">
                        Created: {new Date(token.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </p>
                </div>
                <div className="flex gap-3 mt-1">
                    <p className="text-[11px] text-gray-500 font-medium">
                        Exp: {new Date(token.expiredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </p>
                </div>

                <div className="flex gap-3 mt-1">
                    <p className="text-[11px] text-blue-600 font-bold bg-blue-50 rounded">
                        Transaction Limit: {token.transactionslimit}
                    </p>
                </div>
            </div>
            <button
                onClick={() => onAction(token)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${actionColor} transition-all opacity-100 group-hover:opacity-100 focus:opacity-100 shrink-0 ml-4 shadow-sm`}
            >
                {actionLabel}
            </button>
        </div>
    )
}

// Modal Component
function Modal({ show, onClose, title, children }) {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-all" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 scale-100 transition-all border border-gray-200 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}


export default function DashboardV2() {
    const [tokens, setTokens] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const router = useRouter()
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [isCheckingAuth, setCheckingAuth] = useState(true)
    const [adminUsername, setAdminUsername] = useState('Admin')

    // Modal & Form States
    const [isCreateModalOpen, setCreateModalOpen] = useState(false)
    const [isActionModalOpen, setActionModalOpen] = useState(false)
    const [selectedToken, setSelectedToken] = useState(null)

    // Form Inputs
    const [newUsername, setNewUsername] = useState('')
    const [newExpiryDays, setNewExpiryDays] = useState(30)
    const [newLimit, setNewLimit] = useState(100) // Default limit transaksi

    const [extendDays, setExtendDays] = useState(30)
    const [updateLimit, setUpdateLimit] = useState(100) // State untuk update limit

    // --- Data Fetching ---
    const fetchTokens = async () => {
        const token = localStorage.getItem('token')
        if (!token) { router.push('/auth/loginv2'); return }

        const payload = getPayloadFromToken(token);
        if (payload && payload.username) {
            setAdminUsername(payload.username);
        }

        try {
            setIsLoading(true); setError(null)
            const res = await api.get('/api/xltoken/gettoken')
            setTokens(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
        } catch (err) {
            if (err?.response?.status === 401 || err?.response?.data?.message === 'token invalid') {
                localStorage.removeItem('token'); router.push('/auth/loginv2'); return
            }
            setError('Gagal mengambil data token')
        } finally { setIsLoading(false); setCheckingAuth(false) }
    }
    useEffect(() => { fetchTokens() }, [])

    // --- Computed Data ---
    const activeTokens = tokens.filter(t => t.isactive);
    const revokedTokens = tokens.filter(t => !t.isactive);
    const totalTokens = tokens.length;

    // --- Action Handlers ---
    const handleCreateToken = async (e, type) => {
        e.preventDefault()
        if (!newUsername || newExpiryDays <= 0) return alert('Data tidak valid.')
        try {
            const endpoint = type === 'random' ? "/api/xltoken/createtoken" : "/api/xltoken/createtokencustom"
            // Mengirim transaksi limit sesuai requirement baru
            await api.post(endpoint, {
                username: newUsername,
                expired: parseInt(newExpiryDays),
                transactionslimit: parseInt(newLimit)
            })
            setCreateModalOpen(false);
            setNewUsername('');
            setNewExpiryDays(30);
            setNewLimit(100);
            fetchTokens()
        } catch (err) { alert(`Gagal: ${err.response?.data?.message || err.message}`) }
    }

    const handleRevoke = async (id) => {
        if (!window.confirm('Revoke token ini?')) return;
        try {
            const res = await api.put(`/api/xltoken/revoketoken/${id}`);
            setTokens(prev => prev.map(t => t._id === id ? { ...t, isactive: res.data.data.isactive } : t));
            setActionModalOpen(false);
        } catch (err) { alert(`Gagal revoke: ${err.message}`) }
    }
    const handleDelete = async (id) => {
        if (!window.confirm('Hapus permanen token ini?')) return;
        try {
            await api.delete(`/api/xltoken/deletetoken/${id}`);
            setTokens(prev => prev.filter(t => t._id !== id));
            setActionModalOpen(false);
        } catch (err) { alert(`Gagal hapus: ${err.message}`) }
    }

    const handleExtend = async (e) => {
        e.preventDefault();
        try {
            // Mengirim expiredAt dan transactionslimit saat update
            const res = await api.put(`/api/xltoken/updatetoken/${selectedToken._id}`, {
                expiredAt: parseInt(extendDays),
                transactionslimit: parseInt(updateLimit)
            })
            setTokens(prev => prev.map(t => t._id === res.data.data._id ? res.data.data : t))
            setActionModalOpen(false);
        } catch (err) { alert(`Gagal update: ${err.message}`) }
    }

    const openActionModal = (token) => {
        setSelectedToken(token);
        setActionModalOpen(true);
        setExtendDays(30); // Reset default days
        setUpdateLimit(token.transactionslimit || 100); // Pre-fill dengan limit yang ada
    }


    if (isCheckingAuth) return <div className="min-h-screen flex justify-center items-center bg-[#F0F2F5]"><MinimalistLoader color="bg-gray-600" /></div>

    return (
        <div className="min-h-screen bg-[#F0F2F5] font-['Poppins',_sans-serif] text-[#1A1C23] flex flex-col">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
            `}</style>

            <div className="flex-1 p-6 sm:p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <header className="mb-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Dashboard Admin</h1>
                            <p className="text-gray-600 font-medium mt-1">Selamat datang kembali, {adminUsername.toUpperCase()}!</p>
                        </div>
                        <button onClick={() => { setIsLoggingOut(true); setTimeout(() => { localStorage.removeItem('token'); router.push('/auth/loginv2') }, 1500) }} className="text-sm font-semibold text-white hover:text-white/90 bg-red-600 px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all hover:bg-red-700">
                            Logout
                        </button>
                    </header>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="Sistem Status"
                            value="Normal"
                            bgColor="bg-gray-900"
                            textColor="text-white"
                            subValue={<span className="text-gray-300 font-medium text-sm">Semua layanan berjalan optimal.</span>}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        />
                        <StatCard
                            title="Total Token"
                            value={totalTokens}
                            subValue={<span className="text-purple-700 font-semibold text-xs bg-purple-100 px-2.5 py-1 rounded-lg">{activeTokens.length} aktif • {revokedTokens.length} revoked</span>}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>}
                        />
                        <StatCard
                            title="Token Aktif"
                            value={activeTokens.length}
                            subValue={<span className="text-green-700 font-semibold text-xs bg-green-100 px-2.5 py-1 rounded-lg">+1 baru hari ini</span>}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        />
                        <StatCard
                            title="Token Revoked"
                            value={revokedTokens.length}
                            subValue={<span className="text-orange-700 font-semibold text-xs bg-orange-100 px-2.5 py-1 rounded-lg">Perlu tindakan?</span>}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
                        />
                    </div>

                    {/* Quick Actions */}
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 tracking-tight">Quick Actions</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            <button onClick={() => setCreateModalOpen(true)} className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-100 group-hover:scale-105 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                </div>
                                <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-700 transition-colors">Create Token</span>
                            </button>
                            {/* Tombol Navigasi ke Transactions & Logs (Baru) */}
                            <button onClick={() => router.push('/transactions')} className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-100 group-hover:scale-105 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-bold text-gray-700 group-hover:text-emerald-700 transition-colors">Analytics & Logs</span>
                            </button>
                            <button onClick={() => router.push('/informationcenter')} className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all group">
                                <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-gray-200 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H5M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-bold text-gray-700">Manage Information</span>
                            </button>
                            <button onClick={() => router.push('/dashboard')} className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all group">
                                <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-gray-200 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
                                </div>
                                <span className="text-sm font-bold text-gray-700">Back to V1</span>
                            </button>
                            <button onClick={fetchTokens} className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group col-span-2 sm:col-span-1">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-105 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                </div>
                                <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">Refresh Data</span>
                            </button>
                        </div>
                    </div>

                    {/* Lists */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Kolom Kiri: Active Tokens */}
                        <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-200/60">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Token Aktif Terbaru</h2>
                                <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">{activeTokens.length} active</span>
                            </div>
                            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {isLoading ? <div className="py-10 flex justify-center"><MinimalistLoader color="bg-gray-400" /></div> :
                                    activeTokens.length > 0 ? (
                                        activeTokens.slice(0, 10).map(token => (
                                            <TokenListItem
                                                key={token._id}
                                                token={token}
                                                actionLabel="Manage"
                                                actionColor="border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 bg-white"
                                                onAction={openActionModal}
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-gray-500 font-medium text-sm">Tidak ada token aktif.</div>
                                    )}
                            </div>
                            {activeTokens.length > 10 && <button className="w-full mt-4 text-sm text-indigo-600 font-bold hover:text-indigo-800 transition-colors text-center block">Lihat Semua Active Token →</button>}
                        </div>

                        {/* Kolom Kanan: Revoked/Inactive Tokens */}
                        <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-200/60">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Token Revoked / Non-Aktif</h2>
                                <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{revokedTokens.length} items</span>
                            </div>
                            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {isLoading ? <div className="py-10 flex justify-center"><MinimalistLoader color="bg-gray-400" /></div> :
                                    revokedTokens.length > 0 ? (
                                        revokedTokens.slice(0, 10).map(token => (
                                            <TokenListItem
                                                key={token._id}
                                                token={token}
                                                actionLabel="Detail"
                                                actionColor="border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 bg-white"
                                                onAction={openActionModal}
                                                showRevokedStatus={true}
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-gray-500 font-medium text-sm">Tidak ada token revoked.</div>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="w-full py-6 text-center text-sm text-gray-500 border-t border-gray-200 bg-white/50">
                <p className="font-medium">
                    &copy; {new Date().getFullYear()} <span className="font-semibold text-gray-700">FMP</span> — Token Manager by Faezol.
                </p>
            </footer>

            {/* --- MODALS --- */}

            {/* 1. Create Modal */}
            <Modal
                show={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Buat Token Baru"
            >
                <form className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={newUsername}
                            onChange={e => setNewUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-gray-900"
                            placeholder="Masukkan username unik..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                Masa Aktif (Hari)
                            </label>
                            <input
                                type="number"
                                value={newExpiryDays}
                                onChange={e => setNewExpiryDays(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-gray-900"
                                min="1"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-2">
                                Limit Transaksi
                            </label>
                            <input
                                type="number"
                                value={newLimit}
                                onChange={e => setNewLimit(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-gray-900"
                                min="1"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="submit"
                            onClick={(e) => handleCreateToken(e, "random")}
                            className="w-full py-3.5 px-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200/50 mt-4"
                        >
                            Buat Token Random Sekarang
                        </button>

                        <button
                            type="submit"
                            onClick={(e) => handleCreateToken(e, "custom")}
                            className="w-full py-3.5 px-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200/50 mt-4"
                        >
                            Buat Token Custom Sekarang
                        </button>
                    </div>
                </form>
            </Modal>

            {/* 2. Action/Manage Modal */}
            <Modal show={isActionModalOpen} onClose={() => setActionModalOpen(false)} title="Kelola Token">
                {selectedToken && (
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                            <div className="flex justify-between mb-3">
                                <span className="font-bold text-xl text-gray-900">{selectedToken.username}</span>
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wide ${selectedToken.isactive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {selectedToken.isactive ? 'ACTIVE' : 'REVOKED'}
                                </span>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between gap-3 shadow-sm mb-2">
                                <code className="text-sm text-gray-700 truncate font-mono flex-1 font-medium">{selectedToken.token}</code>
                                <button onClick={() => navigator.clipboard.writeText(selectedToken.token)} className="text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg transition-colors" title="Copy Token">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                </button>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Sisa Limit Transaksi:</span>
                                <span className="font-bold text-gray-900 bg-gray-200 px-2 py-0.5 rounded">{selectedToken.transactionslimit}</span>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-3">Perbarui Token (Aktifkan/Extend)</h4>
                            <form onSubmit={handleExtend} className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Tambah Hari Aktif</label>
                                    <input
                                        type="number"
                                        value={extendDays}
                                        onChange={e => setExtendDays(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white font-medium text-gray-900"
                                        placeholder="30"
                                        min="1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Set Limit Transaksi Baru</label>
                                    <input
                                        type="number"
                                        value={updateLimit}
                                        onChange={e => setUpdateLimit(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white font-medium text-gray-900"
                                        placeholder="100"
                                        min="1"
                                        required
                                    />
                                </div>
                                <button type="submit" className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200/50 mt-2">
                                    Update & Reactivate
                                </button>
                            </form>
                        </div>

                        <hr className="border-gray-200" />

                        <div className="grid grid-cols-2 gap-3">
                            {selectedToken.isactive && (
                                <button onClick={() => handleRevoke(selectedToken._id)} className="py-3 bg-orange-50 text-orange-700 font-bold rounded-xl hover:bg-orange-100 border border-orange-200 transition-all">
                                    Revoke Token
                                </button>
                            )}
                            <button onClick={() => handleDelete(selectedToken._id)} className={`py-3 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 border border-red-200 transition-all ${!selectedToken.isactive ? 'col-span-2' : ''}`}>
                                Hapus Permanen
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {isLoggingOut && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col justify-center items-center z-[60]">
                    <MinimalistLoader color="bg-red-500" />
                    <p className="text-red-600 font-bold mt-4">Logging out...</p>
                </div>
            )}
        </div>
    )
}