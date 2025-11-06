'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
// import FileCard from '@/components/FileCard' // Tidak digunakan lagi, diganti TokenCard
import { useRouter } from 'next/navigation'

// Buat instance axios dengan konfigurasi dasar
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL, // Fallback ke localhost:5000
    timeout: 10000, // timeout 10 detik
    headers: {
        'Content-Type': 'application/json',
    }
})

// Tambahkan interceptor untuk handling error
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            console.error('Response Error:', error.response.data)
        } else if (error.request) {
            console.error('Request Error:', error.request)
        } else {
            console.error('Error:', error.message)
        }
        return Promise.reject(error)
    }
)

// Tambahkan token JWT (untuk auth dashboard) secara otomatis ke setiap request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            // Ini adalah token untuk AUTENTIKASI PENGGUNA DASHBOARD
            // BUKAN token yang sedang dikelola
            config.headers['Bearer'] = token
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Komponen baru untuk menampilkan data token
function TokenCard({ token, onRevoke, onExtend, onDelete }) {
    const [isCopied, setIsCopied] = useState(false)

    const copyToClipboard = (text) => {
        // Fallback untuk 'document.execCommand'
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
        document.body.removeChild(textArea);
    }

    const isActive = token.isactive
    const statusClass = isActive
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800'
    const expiryDate = new Date(token.expiredAt)
    const isExpired = expiryDate < new Date()

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col justify-between relative transition-all hover:shadow-md">
            <div className="flex-1">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 break-all pr-16">{token.username}</h3>
                    <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusClass}`}
                    >
                        {isActive ? 'Active' : 'Revoked'}
                    </span>
                </div>

                <div className="mb-4 space-y-2">
                    <p className="text-sm text-gray-500">Token:</p>
                    <div className="flex items-center gap-2">
                        <pre className="text-xs text-gray-700 bg-gray-50 p-2 rounded-md break-all overflow-x-auto">
                            {token.token}
                        </pre>
                        <button
                            onClick={() => copyToClipboard(token.token)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title="Copy to clipboard"
                        >
                            {isCopied ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <div className="text-sm text-gray-500 space-y-1">
                    <p>
                        Created: {new Date(token.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className={isExpired && isActive ? 'text-red-500 font-medium' : ''}>
                        Expires: {expiryDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {isExpired && isActive && ' (Expired!)'}
                    </p>
                </div>
            </div>

            <hr className="my-4" />

            <div className="flex flex-wrap gap-2">
                {isActive && (
                    <button
                        onClick={() => onRevoke(token._id)}
                        className="flex-1 text-sm bg-yellow-500 text-white px-3 py-1.5 rounded-md hover:bg-yellow-600 transition-colors"
                    >
                        Revoke
                    </button>
                )}
                <button
                    onClick={() => onExtend(token)}
                    className="flex-1 text-sm bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 transition-colors"
                >
                    {isActive ? 'Extend' : 'Reactivate'}
                </button>
                <button
                    onClick={() => onDelete(token._id)}
                    className="flex-1 text-sm bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors"
                >
                    Delete
                </button>
            </div>
        </div>
    )
}

// Modal Component
function Modal({ show, onClose, title, children }) {
    if (!show) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-40 flex justify-center items-center transition-opacity" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-50" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [tokens, setTokens] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const router = useRouter()
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [isCheckingAuth, setCheckingAuth] = useState(true)

    // Modal States
    const [isCreateModalOpen, setCreateModalOpen] = useState(false)
    const [isExtendModalOpen, setExtendModalOpen] = useState(false)
    const [currentTokenToExtend, setCurrentTokenToExtend] = useState(null)

    // Form States
    const [newUsername, setNewUsername] = useState('')
    const [newExpiryDays, setNewExpiryDays] = useState(1)
    const [extendDays, setExtendDays] = useState(30)


    const fetchTokens = async () => {
        const token = localStorage.getItem('token') // Dashboard auth token
        if (!token) {
            router.push('/auth/login')
            return
        }
        try {
            setIsLoading(true)
            setError(null)
            // Ganti endpoint ke /api/xltoken/gettoken
            const res = await api.get('/api/xltoken/gettoken')
            // Urutkan berdasarkan tanggal pembuatan (terbaru dulu)
            setTokens(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
        } catch (err) {
            const message = err?.response?.data?.message
            if (message === 'token invalid' || err?.response?.status === 401) {
                localStorage.removeItem('token')
                router.push('/auth/login')
                return
            }
            setError('Gagal mengambil data token')
        } finally {
            setIsLoading(false)
            setCheckingAuth(false)
        }
    }

    useEffect(() => {
        fetchTokens()
    }, []) // router Dihapus dari dependencies, fetchTokens sudah menangani redirect

    // --- CRUD Handlers ---

    const handleCreateToken = async (e) => {
        e.preventDefault()
        if (!newUsername || newExpiryDays <= 0) {
            alert('Username tidak boleh kosong dan expiry harus > 0 hari.')
            return
        }
        try {
            await api.post('/api/xltoken/createtoken', {
                username: newUsername,
                expired: parseInt(newExpiryDays, 10)
            })
            setCreateModalOpen(false)
            setNewUsername('')
            setNewExpiryDays(1)
            fetchTokens() // Refresh list
        } catch (err) {
            console.error('Failed to create token:', err)
            alert(`Gagal membuat token: ${err.response?.data?.message || err.message}`)
        }
    }

    const handleDeleteToken = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus token ini secara permanen?')) {
            return
        }
        try {
            await api.delete(`/api/xltoken/deletetoken/${id}`)
            setTokens((prev) => prev.filter((token) => token._id !== id))
        } catch (err) {
            console.error('Failed to delete token:', err)
            alert(`Gagal menghapus token: ${err.response?.data?.message || err.message}`)
        }
    }

    const handleRevokeToken = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin mencabut (revoke) token ini?')) {
            return
        }
        try {
            const res = await api.put(`/api/xltoken/revoketoken/${id}`)
            // Update token di state secara lokal
            setTokens((prev) =>
                prev.map((token) =>
                    token._id === id ? { ...token, isactive: res.data.data.isactive } : token
                )
            )
        } catch (err) {
            console.error('Failed to revoke token:', err)
            alert(`Gagal revoke token: ${err.response?.data?.message || err.message}`)
        }
    }

    const handleOpenExtendModal = (token) => {
        setCurrentTokenToExtend(token)
        setExtendDays(30) // Default extend 30 hari
        setExtendModalOpen(true)
    }

    const handleExtendToken = async (e) => {
        e.preventDefault()
        if (extendDays <= 0) {
            alert('Expiry harus > 0 hari.')
            return
        }
        try {
            const res = await api.put(`/api/xltoken/updatetoken/${currentTokenToExtend._id}`, {
                expiredAt: parseInt(extendDays, 10)
            })
            setExtendModalOpen(false)
            setCurrentTokenToExtend(null)
            // Update token di state secara lokal
            setTokens((prev) =>
                prev.map((token) =>
                    token._id === res.data.data._id ? res.data.data : token
                )
            )
            // atau fetchTokens() untuk data paling baru
            // fetchTokens()
        } catch (err) {
            console.error('Failed to extend token:', err)
            alert(`Gagal extend token: ${err.response?.data?.message || err.message}`)
        }
    }

    // Filter tokens berdasarkan search term
    const filteredTokens = tokens.filter(token =>
        token.username?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleLogout = () => {
        setIsLoggingOut(true)
        setTimeout(() => {
            localStorage.removeItem('token')
            router.push('/auth/login')
        }, 1500) // Logout lebih cepat
    }

    if (isCheckingAuth) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-gray-600">Checking authentication...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
            {/* Header */}
            <header className="bg-white/80 border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-800 items-start">Token Management</h1>
                        <div className='flex flex-col md:flex-row gap-2 items-right'>
                            <button
                                onClick={() => setCreateModalOpen(true)} // Buka modal create
                                className="bg-gray-800 text-white px-6 py-2.5 rounded-lg 
              hover:bg-gray-700 transition-all duration-200 
              shadow-sm hover:shadow-md justify-end"
                            >
                                Create Token
                            </button>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 text-white px-6 py-2.5 rounded-lg 
        hover:bg-red-500 transition-all duration-200 
        shadow-sm hover:shadow-md justify-end"
                            >
                                {isLoggingOut ? 'Logging out...' : 'Logout'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="min-h-[75vh] bg-white/80 shadow-sm rounded-2xl p-6 border border-gray-100 pb-12">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <h2 className="text-xl font-semibold text-gray-800">Daftar Token</h2>
                        <div className="relative w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Cari username..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-4 py-2.5 
                bg-white border border-gray-200 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-gray-200
                placeholder-gray-400 text-gray-600
                transition-all duration-200"
                            />
                            <svg
                                className="w-5 h-5 text-gray-400 absolute left-3 top-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50/50 border border-red-100 rounded-lg p-4">
                            <p className="text-red-600 text-center">{error}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTokens.length === 0 ? (
                                <div className="col-span-full h-full text-center py-12">
                                    <p className="text-gray-500">
                                        {searchTerm ? 'Token tidak ditemukan' : 'Belum ada token'}
                                    </p>
                                </div>
                            ) : (
                                filteredTokens.map((token) => (
                                    <TokenCard
                                        key={token._id}
                                        token={token}
                                        onRevoke={handleRevokeToken}
                                        onExtend={handleOpenExtendModal}
                                        onDelete={handleDeleteToken}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>
            <footer className="w-full mt-12 py-6 text-center text-sm text-gray-500">
                <p>
                    &copy; {new Date().getFullYear()} <span className="font-semibold text-gray-700">XLToken</span> — Token Manager.
                </p>
            </footer>

            {/* Logout Overlay */}
            {isLoggingOut && (
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
                        Logging out...
                    </div>
                </div>
            )}

            {/* Create Token Modal */}
            <Modal show={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Token">
                <form onSubmit={handleCreateToken} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500"
                            placeholder="e.g. faezolm99"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1">Masa Aktif (Hari)</label>
                        <input
                            type="number"
                            id="expiry"
                            value={newExpiryDays}
                            onChange={(e) => setNewExpiryDays(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500"
                            min="1"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setCreateModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                            Batal
                        </button>
                        <button type="submit" className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
                            Create
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Extend Token Modal */}
            <Modal show={isExtendModalOpen} onClose={() => setExtendModalOpen(false)} title="Extend/Reactivate Token">
                <form onSubmit={handleExtendToken} className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Token untuk user: <span className="font-semibold text-gray-900">{currentTokenToExtend?.username}</span>
                    </p>
                    <div>
                        <label htmlFor="extend" className="block text-sm font-medium text-gray-700 mb-1">Tambah Masa Aktif (Hari)</label>
                        <p className="text-xs text-gray-500 mb-1">Jumlah hari baru dihitung dari *sekarang*.</p>
                        <input
                            type="number"
                            id="extend"
                            value={extendDays}
                            onChange={(e) => setExtendDays(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500"
                            min="1"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setExtendModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                            Batal
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Update Token
                        </button>
                    </div>
                </form>
            </Modal>

        </div>
    )
}