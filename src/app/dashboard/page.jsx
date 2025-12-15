'use client'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

// ==========================================
// 1. UTILITIES & STANDALONE FUNCTIONS
// ==========================================

// Mock useRouter
const useRouter = () => {
    return {
        push: (url) => {
            window.location.href = url;
        }
    };
};

// Loader Script Helper
const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            if (window.html2canvas) {
                resolve();
            } else {
                setTimeout(() => resolve(), 500);
            }
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => setTimeout(resolve, 200);
        script.onerror = reject;
        document.body.appendChild(script);
    });
};

/**
 * FUNGSI UTAMA SHARE (Bisa dipisah ke file utils/shareToken.js)
 * Menangani logika generate gambar, copy text, dan share/download.
 */
const shareToken = async (printElement, token) => {
    const isActive = token.isactive;
    const expiryDate = new Date(token.expiredAt);
    const optionsDate = { day: 'numeric', month: 'long', year: 'numeric' };
    const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: false };

    const dateStr = expiryDate.toLocaleDateString("id-ID", optionsDate);
    const timeStr = expiryDate.toLocaleTimeString("id-ID", optionsTime).replace(':', '.');

    // 1. Format Text Presisi
    const shareText =
        "```\n" +
        "=== TOKEN INFO ===\n" +
        `Username         : ${token.username}\n` +
        `Status           : ${token.isactive ? "Active" : "Revoked"}\n` +
        `Transaction Limit: ${token.transactionslimit}\n` +
        `Expires          : ${expiryDate.toLocaleString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })}\n` +
        "------------------\n" +
        `TOKEN:\n${token.token}\n` +
        "==================\n" +
        "```";

    // 2. Helper Copy Clipboard
    const copyToClipboard = () => {
        const textArea = document.createElement("textarea");
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Copy failed', err);
        }
        document.body.removeChild(textArea);
    };

    try {
        // Load html2canvas jika belum ada
        if (!window.html2canvas) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        }

        if (!window.html2canvas || !printElement) {
            throw new Error("Library not loaded or element missing");
        }

        // Generate Image
        const canvas = await window.html2canvas(printElement, {
            backgroundColor: null, // Transparent/White handled by CSS
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true,
            scrollY: -window.scrollY
        });

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], `token-${token.username}.png`, { type: 'image/png' });

        const shareData = {
            title: `Token Access: ${token.username}`,
            text: shareText,
            files: [file]
        };

        // Salin teks dulu sebelum share action
        copyToClipboard();

        // Coba Web Share API
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share(shareData);
                return { success: true, type: 'share' };
            } catch (shareError) {
                if (shareError.name !== 'AbortError') throw shareError;
                return { success: false, type: 'cancelled' };
            }
        } else {
            // Fallback ke Download
            const link = document.createElement('a');
            link.download = `token-${token.username}.png`;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return { success: true, type: 'download' };
        }
    } catch (error) {
        console.error('Share Logic Error:', error);
        // Tetap copy text jika gambar gagal
        copyToClipboard();
        throw error;
    }
};

// ==========================================
// 2. STANDALONE COMPONENTS
// ==========================================
const TokenExportTemplate = ({ token, printRef }) => {
    const isActive = token.isactive;
    const expiryDateObj = new Date(token.expiredAt);
    const isExpired = expiryDateObj < new Date();

    const calculateRemainingDays = () => {
        const diffTime = expiryDateObj - new Date();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }

    const diffDays = calculateRemainingDays();
    const limit = token.transactionslimit;

    return (
        <div
            ref={printRef}
            style={{
                width: '420px',
                padding: '32px 28px',
                fontFamily: '"Courier New", Courier, monospace',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                margin: 0,
                position: 'fixed',
                top: '-10000px',
                left: '-10000px',
                zIndex: -1,
                // borderTop: '3px dashed #000',
                // borderBottom: '3px dashed #000'
            }}
        >
            {/* Header Store */}
            <div style={{ textAlign: 'center', marginBottom: '20px', margin: '0 0 20px 0' }}>
                <h1 style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    color: '#000',
                    margin: '0 0 4px 0',
                    padding: 0,
                    letterSpacing: '2px'
                }}>
                    FMP TOKEN MANAGER
                </h1>
                <p style={{
                    fontSize: '11px',
                    color: '#666',
                    margin: 0,
                    padding: 0,
                    letterSpacing: '1px'
                }}>
                    ─────────────────────
                </p>
            </div>

            {/* Receipt Info */}
            <div style={{ marginBottom: '16px', margin: '0 0 16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', margin: '0 0 6px 0' }}>
                    <span style={{ fontSize: '12px', color: '#333' }}>TANGGAL</span>
                    <span style={{ fontSize: '12px', color: '#000', fontWeight: '600' }}>
                        {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', margin: '0 0 6px 0' }}>
                    <span style={{ fontSize: '12px', color: '#333' }}>WAKTU</span>
                    <span style={{ fontSize: '12px', color: '#000', fontWeight: '600' }}>
                        {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                </div>
            </div>

            {/* Separator */}
            <div style={{
                borderTop: '2px dashed #999',
                margin: '16px 0',
                padding: 0
            }}></div>

            {/* Main Content - Username & Status */}
            <div style={{ marginBottom: '16px', margin: '0 0 16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', margin: '0 0 8px 0' }}>
                    <span style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>USERNAME:</span>
                    <span
                        style={{
                            backgroundColor: isActive ? '#000' : '#666',
                            color: '#fff',
                            padding: '10px 10px 20px 10px',
                            fontSize: '10px',
                            fontWeight: '700',
                            letterSpacing: '1px',
                        }}
                    >
                        {isActive ? 'ACTIVE' : 'REVOKED'}
                    </span>
                </div>
                <div style={{
                    backgroundColor: '#f5f5f5',
                    padding: '5px 10px 20px 10px',
                    margin: 0,
                    border: '1px solid #ddd'
                }}>
                    <p style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#000',
                        margin: 0,
                        padding: 0,
                        wordBreak: 'break-all'
                    }}>
                        {token.username}
                    </p>
                </div>
            </div>

            {/* Token Value */}
            <div style={{ marginBottom: '16px', margin: '0 0 16px 0' }}>
                <p style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#666',
                    margin: '0 0 8px 0',
                    padding: 0,
                    letterSpacing: '1px'
                }}>
                    TOKEN VALUE:
                </p>
                <div style={{
                    backgroundColor: '#000',
                    color: '#fff',
                    padding: '5px 10px 20px 10px',
                    margin: 0,
                    fontSize: '11px',
                    fontFamily: '"Courier New", Courier, monospace',
                    wordBreak: 'break-all',
                    lineHeight: '1.6',
                    letterSpacing: '0.5px'
                }}>
                    {token.token}
                </div>
            </div>

            {/* Separator */}
            <div style={{
                borderTop: '2px dashed #999',
                margin: '16px 0',
                padding: 0
            }}></div>

            {/* Transaction Details */}
            <div style={{ marginBottom: '16px', margin: '0 0 16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', margin: '0 0 8px 0' }}>
                    <span style={{ fontSize: '12px', color: '#333' }}>Sisa Waktu Aktif</span>
                    <span style={{ fontSize: '13px', color: '#000', fontWeight: '700' }}>
                        {isActive && !isExpired ? (diffDays >= 100 ? 'UNLIMITED' : `${diffDays} HARI`) : 'EXPIRED'}
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', margin: '0 0 8px 0' }}>
                    <span style={{ fontSize: '12px', color: '#333' }}>Limit Transaksi</span>
                    <span style={{ fontSize: '13px', color: '#000', fontWeight: '700' }}>
                        {limit} X Transaksi
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', margin: '0 0 8px 0' }}>
                    <span style={{ fontSize: '12px', color: '#333' }}>Tanggal Dibuat</span>
                    <span style={{ fontSize: '11px', color: '#000', fontWeight: '600' }}>
                        {new Date(token.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: 0 }}>
                    <span style={{ fontSize: '12px', color: '#333' }}>Tanggal Kadaluwarsa</span>
                    <span style={{ fontSize: '11px', color: '#000', fontWeight: '600' }}>
                        {new Date(token.expiredAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Separator */}
            <div style={{
                borderTop: '2px dashed #999',
                margin: '16px 0',
                padding: 0
            }}></div>

            {/* Footer */}
            <div style={{ textAlign: 'center', margin: 0 }}>
                <p style={{
                    fontSize: '11px',
                    color: '#666',
                    margin: '0 0 6px 0',
                    padding: 0,
                    letterSpacing: '0.5px'
                }}>
                    TERIMA KASIH
                </p>
                <p style={{
                    fontSize: '10px',
                    color: '#999',
                    margin: 0,
                    padding: 0
                }}>
                    www.tokenmanagement-fmp.vercel.app
                </p>
                <p style={{
                    fontSize: '9px',
                    color: '#ccc',
                    margin: '12px 0 0 0',
                    padding: 0,
                    letterSpacing: '1px'
                }}>
                    ──── FMP TOKEN MANAGER BY FMP ────
                </p>
            </div>
        </div>
    );
};

function MinimalistLoader({ color = 'bg-gray-800' }) {
    const styleSheet = `
    @keyframes bounce-up-down {
      0%, 100% { transform: translateY(0); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
      50% { transform: translateY(-10px); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
    }
  `;
    return (
        <>
            <style>{styleSheet}</style>
            <div className="flex gap-1.5 justify-center items-center">
                <div className={`w-2 h-2 rounded-full ${color}`} style={{ animation: 'bounce-up-down 1.4s infinite ease-in-out', animationDelay: '-0.32s' }}></div>
                <div className={`w-2 h-2 rounded-full ${color}`} style={{ animation: 'bounce-up-down 1.4s infinite ease-in-out', animationDelay: '-0.16s' }}></div>
                <div className={`w-2 h-2 rounded-full ${color}`} style={{ animation: 'bounce-up-down 1.4s infinite ease-in-out' }}></div>
            </div>
        </>
    );
}

// ==========================================
// 3. MAIN UI COMPONENTS
// ==========================================

// Token Card Component
function TokenCard({ token, onRevoke, onExtend, onDelete }) {
    const [isCopied, setIsCopied] = useState(false)
    const [isShareCopied, setIsShareCopied] = useState(false)
    const [isSharing, setIsSharing] = useState(false)

    // Ref hanya digunakan untuk menghubungkan Template dengan Logic
    const printRef = useRef(null)

    const handleCopyToken = () => {
        navigator.clipboard.writeText(token.token);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }

    // Menggunakan fungsi shareToken yang sudah dipisah
    const onShareClick = async () => {
        if (isSharing) return;
        setIsSharing(true);
        try {
            const result = await shareToken(printRef.current, token);

            // UI Feedback
            if (result.type === 'download') {
                alert('Teks Info telah disalin. Gambar token sedang diunduh ke galeri.');
            } else if (result.type === 'share') {
                console.log('Shared successfully');
            }

            setIsShareCopied(true);
            setTimeout(() => setIsShareCopied(false), 2000);
        } catch (error) {
            alert(`Gagal memproses gambar. Teks token telah disalin.`);
            setIsShareCopied(true); // Tetap kasih feedback copied karena teks disalin
            setTimeout(() => setIsShareCopied(false), 2000);
        } finally {
            setIsSharing(false);
        }
    };

    const isActive = token.isactive;
    const statusClass = isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    const expiryDateObj = new Date(token.expiredAt);
    const isExpired = expiryDateObj < new Date();

    return (
        <>
            {/* Panggil Komponen Template Share di sini, pass ref dan data */}
            <TokenExportTemplate token={token} printRef={printRef} />

            {/* UI Kartu Utama Dashboard */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col justify-between relative transition-all hover:shadow-md">
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 break-all pr-16">{token.username}</h3>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusClass}`}>
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
                                onClick={handleCopyToken}
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
                            Expires: {expiryDateObj.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            {isExpired && isActive && ' (Expired!)'}
                        </p>
                    </div>
                </div>

                <hr className="my-4" />

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={onShareClick}
                        disabled={isSharing}
                        className={`flex-auto text-sm px-3 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 
                        ${isSharing ? 'bg-gray-400 cursor-wait' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                        title="Share image & text"
                    >
                        {isSharing ? (
                            <span className="text-xs">Generating...</span>
                        ) : isShareCopied ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Copied!</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                </svg>
                                <span>Share</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </>
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

// --- API & AXIOS CONFIG ---
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
})

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

api.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
            config.headers['Bearer'] = token
        }
        return config
    },
    (error) => Promise.reject(error)
)

export default function Dashboard() {
    // --- MOCK DATA FOR DEMONSTRATION ---
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
        const token = localStorage.getItem('token')
        if (!token) {
            // Uncomment to enforce auth
            router.push('/auth/loginv2')
            return
        }
        try {
            setIsLoading(true)
            setError(null)

            // Try to fetch from API
            try {
                const res = await api.get('/api/xltoken/gettoken')
                setTokens(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
            } catch (apiError) {
                console.warn("API failed, using mock data for UI demo", apiError);
                // Fallback Mock Data so the UI is visible for the user to see the Share Feature
                setTokens([
                    {
                        _id: '1',
                        username: 'demo_user_01',
                        token: 'xl_token_sample_1234567890abcdef',
                        isactive: true,
                        transactionslimit: 100,
                        expiredAt: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
                        createdAt: new Date().toISOString()
                    },
                    {
                        _id: '2',
                        username: 'expired_user_99',
                        token: 'xl_token_old_sample_987654321',
                        isactive: false,
                        transactionslimit: 50,
                        expiredAt: new Date(Date.now() - 86400000).toISOString(), // yesterday
                        createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
                    }
                ]);
            }

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
        // Preload html2canvas
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js').catch(e => console.error("Failed to load html2canvas", e));
        fetchTokens()
    }, [])

    // --- CRUD Handlers ---

    const handleCreateToken = async (e) => {
        e.preventDefault()
        if (!newUsername || newExpiryDays <= 0) {
            alert('Username tidak boleh kosong dan expiry harus > 0 hari.')
            return
        }
        try {
            // Mocking API call
            // await api.post('/api/xltoken/createtoken', ...)

            const newToken = {
                _id: Date.now().toString(),
                username: newUsername,
                token: `xl_token_${Math.random().toString(36).substring(7)}`,
                isactive: true,
                transactionslimit: 50,
                expiredAt: new Date(Date.now() + 86400000 * parseInt(newExpiryDays)).toISOString(),
                createdAt: new Date().toISOString()
            };

            setTokens(prev => [newToken, ...prev]);

            setCreateModalOpen(false)
            setNewUsername('')
            setNewExpiryDays(1)
            // fetchTokens() 
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
            // await api.delete(`/api/xltoken/deletetoken/${id}`)
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
            // const res = await api.put(`/api/xltoken/revoketoken/${id}`)
            setTokens((prev) =>
                prev.map((token) =>
                    token._id === id ? { ...token, isactive: false } : token
                )
            )
        } catch (err) {
            console.error('Failed to revoke token:', err)
            alert(`Gagal revoke token: ${err.response?.data?.message || err.message}`)
        }
    }

    const handleOpenExtendModal = (token) => {
        setCurrentTokenToExtend(token)
        setExtendDays(30)
        setExtendModalOpen(true)
    }

    const handleExtendToken = async (e) => {
        e.preventDefault()
        if (extendDays <= 0) {
            alert('Expiry harus > 0 hari.')
            return
        }
        try {
            // const res = await api.put(...)

            setTokens((prev) =>
                prev.map((token) =>
                    token._id === currentTokenToExtend._id ? {
                        ...token,
                        isactive: true,
                        expiredAt: new Date(Date.now() + 86400000 * parseInt(extendDays)).toISOString()
                    } : token
                )
            )
            setExtendModalOpen(false)
            setCurrentTokenToExtend(null)
        } catch (err) {
            console.error('Failed to extend token:', err)
            alert(`Gagal extend token: ${err.response?.data?.message || err.message}`)
        }
    }

    const filteredTokens = tokens.filter(token =>
        token.username?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleLogout = () => {
        setIsLoggingOut(true)
        setTimeout(() => {
            localStorage.removeItem('token')
            router.push('/auth/loginv2')
        }, 1500)
    }

    if (isCheckingAuth) {
        return (
            <div className="flex justify-center items-center min-h-screen flex-col gap-4">
                <MinimalistLoader color="bg-gray-600" />
                <p className="text-gray-600">Checking authentication...</p>
            </div>
        )
    }

    return (

        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
            <header className="bg-white/80 border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-800 items-start">Token Management</h1>
                        <div className='flex flex-col md:flex-row gap-2 items-right'>
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
                            <MinimalistLoader color="bg-gray-800" />
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
                    &copy; {new Date().getFullYear()} <span className="font-semibold text-gray-700">FMP</span> — Token Manager by Faezol.
                </p>
            </footer>

            {isLoggingOut && (
                <div className="fixed inset-0 bg-white/70 flex justify-center items-center z-50 transition-opacity duration-300">
                    <div className="text-gray-800 text-lg flex flex-col items-center gap-3">
                        <MinimalistLoader color="bg-gray-700" />
                        Logging out...
                    </div>
                </div>
            )}

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