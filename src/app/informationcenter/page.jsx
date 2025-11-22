'use client'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

// --- Konfigurasi API ---
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
})

// Interceptor
api.interceptors.response.use(r => r, e => Promise.reject(e))
api.interceptors.request.use(c => {
    const t = localStorage.getItem('token'); 
    if (t) c.headers['Bearer'] = t; 
    return c
}, e => Promise.reject(e))

// --- Helper Components ---

function MinimalistLoader({ color = 'bg-gray-800' }) {
    const styleSheet = `
    @keyframes bounce-up-down {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
  `;
    return (
        <>
            <style>{styleSheet}</style>
            <div className="flex gap-1.5 justify-center items-center px-4 py-2">
                <div className={`w-1.5 h-1.5 rounded-full ${color}`} style={{ animation: 'bounce-up-down 1s infinite ease-in-out -0.32s' }}></div>
                <div className={`w-1.5 h-1.5 rounded-full ${color}`} style={{ animation: 'bounce-up-down 1s infinite ease-in-out -0.16s' }}></div>
                <div className={`w-1.5 h-1.5 rounded-full ${color}`} style={{ animation: 'bounce-up-down 1s infinite ease-in-out' }}></div>
            </div>
        </>
    );
}

// --- 1. Widget: Horizontal Info Card (Top Right) ---
function HorizontalInfoCard({ info, index, onEdit, onDelete, onView }) {
    const colors = [
        { bg: 'bg-[#C8BFF9]', text: 'text-[#3E3375]', btn: 'bg-white/30 hover:bg-white/50' },
        { bg: 'bg-[#FADBC3]', text: 'text-[#69462C]', btn: 'bg-white/30 hover:bg-white/50' },
        { bg: 'bg-[#EBF963]', text: 'text-[#4A5202]', btn: 'bg-black/10 hover:bg-black/20' },
    ];
    const theme = colors[index % colors.length];

    return (
        <div className={`min-w-[300px] w-[330px] h-[200px] ${theme.bg} rounded-[2rem] p-6 flex flex-col justify-between relative group transition-all hover:-translate-y-1 shadow-sm snap-center`}>
            <div className="flex justify-between items-start">
                <span className={`text-[10px] font-bold uppercase tracking-wider opacity-70 ${theme.text}`}>
                    {new Date(info.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(info)} className={`p-1.5 rounded-full ${theme.btn} ${theme.text}`}><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button onClick={() => onDelete(info._id)} className={`p-1.5 rounded-full ${theme.btn} ${theme.text}`}><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
            </div>

            <div className="flex-1 mt-3 overflow-hidden">
                <h4 className={`text-base font-bold leading-snug line-clamp-4 text-justify ${theme.text}`}>
                    {info.information}
                </h4>
            </div>

            <div className="mt-3 flex items-center justify-between">
                <div className={`h-1 w-1/3 bg-black/5 rounded-full overflow-hidden`}>
                    <div className={`h-full w-1/2 bg-current opacity-30 ${theme.text}`}></div>
                </div>
                {/* Tombol Selengkapnya trigger onView */}
                <button
                    onClick={() => onView(info)}
                    className={`text-[10px] font-bold flex items-center gap-1 ${theme.text} opacity-80 hover:opacity-100 transition-opacity`}
                >
                    Selengkapnya <span className="text-lg leading-none">›</span>
                </button>
            </div>
        </div>
    )
}

// --- 2. Widget: Info Slider (Bottom Section) ---
function InfoSliderWidget({ infos }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (infos.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % infos.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [infos.length]);

    if (infos.length === 0) return <div className="p-6 text-gray-400 text-sm">No information available for preview.</div>;

    const currentInfo = infos[currentIndex];

    return (
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-md border border-gray-200/60 w-full flex flex-col relative overflow-hidden min-h-[300px] sm:min-h-full">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="font-bold text-lg sm:text-xl text-gray-900">Preview Information</h3>
                <span className="text-[10px] sm:text-xs font-medium text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Live
                </span>
            </div>

            <div className="flex-1 flex flex-col justify-center relative z-10 w-full">
                <div key={currentIndex} className="animate-fade-in-up w-full">
                    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-50 text-orange-500 rounded-2xl flex-shrink-0 flex items-center justify-center">
                            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                        </div>
                        <div className="w-full">
                            <h4 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight text-justify whitespace-pre-wrap">
                                {currentInfo.information}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-500 font-medium">
                                Published on {new Date(currentInfo.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 sm:mt-8 flex justify-between items-end border-t border-gray-100 pt-4 sm:pt-6">
                <div className="flex gap-1.5 sm:gap-2">
                    {infos.slice(0, 10).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ${idx === currentIndex ? 'w-6 sm:w-8 bg-orange-500' : 'w-1.5 sm:w-2 bg-gray-200 hover:bg-gray-300'}`}
                        ></button>
                    ))}
                </div>
                <span className="text-[10px] sm:text-xs text-gray-400 font-mono">
                    {currentIndex + 1} / {infos.length}
                </span>
            </div>
        </div>
    )
}

// --- 3. Widget: Statistic Card ---
function StatisticCard({ value, label, subtext, icon }) {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-200/60 flex flex-col justify-between min-h-[140px] transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-sm font-semibold mb-1 text-gray-600">{label}</h3>
                    <p className="text-4xl font-bold text-gray-900">{value}</p>
                </div>
                <div className="p-3 rounded-full bg-gray-50 text-indigo-600">
                    {icon}
                </div>
            </div>
            {subtext && (
                <div className="text-sm mt-4 font-medium text-gray-500">
                    {subtext}
                </div>
            )}
        </div>
    )
}

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

// --- MAIN PAGE COMPONENT ---
export default function InformationPage() {
    const [infos, setInfos] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [isCheckingAuth, setCheckingAuth] = useState(true)
    const router = useRouter()

    const scrollContainerRef = useRef(null);

    // Modal States
    const [isModalOpen, setModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    // State untuk View Detail
    const [isViewOpen, setViewOpen] = useState(false)
    const [selectedInfo, setSelectedInfo] = useState(null)

    const [currentId, setCurrentId] = useState(null)
    const [infoText, setInfoText] = useState('')

    const [username, setusername] = useState('')

    // Fetch Data
    const fetchInfos = async () => {
        const token = localStorage.getItem('token')
        if (!token) { router.push('/auth/login'); return }

        const payload = getPayloadFromToken(token)
        if(payload && payload.username){
            setusername(payload.username);
        }

        try {
            setIsLoading(true)
            const res = await api.get('/api/xlinformation/getinformation')
            setInfos(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
        } catch (err) {
            console.error(err)
        } finally { setIsLoading(false); setCheckingAuth(false) }
    }

    useEffect(() => { fetchInfos() }, [])

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = 320;
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    // Handlers
    const handleOpenCreate = () => { setIsEditing(false); setInfoText(''); setModalOpen(true); }

    const handleOpenEdit = (info) => { setIsEditing(true); setCurrentId(info._id); setInfoText(info.information); setModalOpen(true); }

    // New Handler for Viewing Details
    const handleOpenView = (info) => {
        setSelectedInfo(info);
        setViewOpen(true);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) await api.put(`/api/xlinformation/updateinformation/${currentId}`, { information: infoText });
            else await api.post('/api/xlinformation/createinformation', { information: infoText });
            setModalOpen(false); fetchInfos();
        } catch (err) { alert("Gagal menyimpan data") }
    }

    const handleDelete = async (id) => {
        if (window.confirm("Hapus info ini?")) {
            try { await api.delete(`/api/xlinformation/deleteinformation/${id}`); fetchInfos(); }
            catch (err) { alert("Gagal menghapus") }
        }
    }

    if (isCheckingAuth) return <div className="min-h-screen flex justify-center items-center bg-[#F0F2F5]"><MinimalistLoader color="bg-gray-600" /></div>

    return (
        <div className="min-h-screen bg-[#F0F2F5] font-['Poppins',_sans-serif] text-[#1A1C23] flex flex-col">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out; }
            `}</style>

            <div className="flex-1 p-6 sm:p-8">
                <div className="max-w-[1200px] mx-auto">
                    <header className="mb-8 flex flex-col sm:flex-row justify-between items-center sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Information Center</h1>
                            <p className="text-gray-600 font-medium mt-1">Kelola pengumuman dan informasi sistem.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => router.push('/dashboardv2')} className="text-sm font-semibold text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:shadow transition-all">
                                ← Back to V2
                            </button>
                            <button onClick={handleOpenCreate} className="text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                Add New
                            </button>
                        </div>
                    </header>
                    <div className="mb-10">
                        <div className="h-auto min-h-[320px]">
                            <InfoSliderWidget infos={infos} />
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 mb-10">
                        <div className="lg:w-1/3 bg-white rounded-[2.5rem] p-8 shadow-md border border-gray-200/60 flex flex-col justify-center min-h-[320px]">
                            {/* <h2 className="text-3xl font-bold text-gray-900 mb-3">Hello, Admin!</h2> */}
                            <h2 className="text-3xl font-bold text-gray-900 mb-3">Hello, {username.toUpperCase()}!</h2>
                            <p className="text-gray-600 mb-8 leading-relaxed">
                                Anda memiliki <span className="font-bold text-indigo-600">{infos.length} informasi</span> aktif. Gunakan panel kanan untuk melihat daftar kartu secara horizontal.
                            </p>
                            <button onClick={handleOpenCreate} className="w-fit bg-gray-900 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-black transition-all flex items-center gap-2 shadow-md group">
                                Buat Info Baru
                                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </button>
                        </div>

                        <div className="lg:w-2/3 w-full relative flex flex-col justify-center">
                            <div
                                ref={scrollContainerRef}
                                className="w-full overflow-x-auto hide-scrollbar pb-4 flex items-center snap-x snap-mandatory"
                            >
                                <div className="flex gap-5 pr-4 pl-2">
                                    {isLoading ? (
                                        <div className="flex justify-center w-full py-10"><MinimalistLoader color="bg-gray-400" /></div>
                                    ) : infos.length === 0 ? (
                                        <div className="text-gray-400 text-sm italic bg-white p-6 rounded-2xl border border-dashed border-gray-300 w-full text-center">Belum ada informasi yang dibuat.</div>
                                    ) : (
                                        infos.map((info, idx) => (
                                            <HorizontalInfoCard
                                                key={info._id}
                                                info={info}
                                                index={idx}
                                                onEdit={handleOpenEdit}
                                                onDelete={handleDelete}
                                                onView={handleOpenView} // Pass the view handler
                                            />
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-center lg:justify-end gap-2 mb-4 px-2">
                                <button onClick={() => scroll('left')} className="p-3 bg-white rounded-full shadow-md text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition-all active:scale-95 border border-gray-100">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <button onClick={() => scroll('right')} className="p-3 bg-white rounded-full shadow-md text-gray-600 hover:text-indigo-600 hover:bg-gray-50 transition-all active:scale-95 border border-gray-100">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-5 tracking-tight">Statistics Overview</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <StatisticCard
                                value={infos.length}
                                label="Total Informasi"
                                subtext="All time created"
                                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                            />
                            <StatisticCard
                                value={infos.length}
                                label="Info Aktif"
                                subtext="Currently visible"
                                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            />
                            <StatisticCard
                                value="24/7"
                                label="System Status"
                                subtext="Operational"
                                icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                            />
                        </div>
                    </div>


                </div>
            </div>

            <footer className="w-full py-6 text-center text-sm text-gray-500 border-t border-gray-200 bg-white/50">
                <p className="font-medium">
                    &copy; {new Date().getFullYear()} <span className="font-semibold text-gray-700">FMP</span> — Token Manager by Faezol.
                </p>
            </footer>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={() => setModalOpen(false)}>
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-gray-200" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">{isEditing ? "Edit Info" : "New Info"}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Content</label>
                                <textarea
                                    value={infoText}
                                    onChange={e => setInfoText(e.target.value)}
                                    className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 focus:border-indigo-500 rounded-2xl outline-none font-medium text-gray-900 min-h-[120px] resize-none transition-all"
                                    placeholder="Type information here..."
                                    required
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Details Modal (Selengkapnya) */}
            {isViewOpen && selectedInfo && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={() => setViewOpen(false)}>
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Detail Informasi</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Created on {new Date(selectedInfo.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <button onClick={() => setViewOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                                <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                            <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap text-justify">
                                {selectedInfo.information}
                            </p>
                        </div>

                        <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
                            <button onClick={() => setViewOpen(false)} className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}