'use client'
import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { io } from "socket.io-client";
import FlipClock from '../../components/flipClock'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// --- Konfigurasi API ---
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
})

// -- konfigurasi socket --
const socket = io(BASE_URL, {
    transports: ["websocket"],
    autoConnect: false, // penting
});

// Interceptor
api.interceptors.response.use(r => r, e => Promise.reject(e))
api.interceptors.request.use(c => {
    const t = localStorage.getItem('token'); if (t) c.headers['Bearer'] = t; return c
}, e => Promise.reject(e))

// --- Helper Functions ---
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit'
    });
}

// --- Komponen Loader ---
function MinimalistLoader({ color = 'bg-gray-800' }) {
    return (
        <div className="flex gap-1.5 justify-center items-center px-4 py-2">
            <div className={`w-1.5 h-1.5 rounded-full ${color} animate-bounce [animation-delay:-0.3s]`}></div>
            <div className={`w-1.5 h-1.5 rounded-full ${color} animate-bounce [animation-delay:-0.15s]`}></div>
            <div className={`w-1.5 h-1.5 rounded-full ${color} animate-bounce`}></div>
        </div>
    );
}

// --- Komponen Running Text (Ticker) ---
function TransactionTicker({ logs }) {
    const todayLogs = useMemo(() => {
        const now = new Date();
        return logs.filter(l => {
            const d = new Date(l.createdAt);
            return d.toDateString() === now.toDateString();
        });
    }, [logs]);

    // Durasi animasi dinamis
    const duration = Math.max(15, todayLogs.length * 4);

    return (
        <div className="w-full bg-gray-900 text-white overflow-hidden h-10 mb-8 rounded-xl shadow-md border border-gray-800 relative group flex items-center">
            {/* Label Static di Kiri */}
            <div className="absolute left-0 top-0 bottom-0 z-20 bg-gray-900 px-3 sm:px-4 flex items-center border-r border-gray-700 shadow-[4px_0_15px_rgba(0,0,0,0.8)]">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="hidden sm:inline">Live Transaction</span>
                    <span className="sm:hidden">Live</span> {/* Text pendek untuk mobile */}
                </span>
            </div>

            {/* Area Marquee */}
            <div className="relative w-full h-full overflow-hidden flex items-center pl-24 sm:pl-40">
                {todayLogs.length > 0 ? (
                    <div
                        className="whitespace-nowrap absolute flex items-center will-change-transform"
                        style={{
                            animation: `marquee ${duration}s linear infinite`,
                            paddingLeft: '100%',
                        }}
                    >
                        {todayLogs.map((log, idx) => (
                            <span key={log._id} className="mx-4 text-xs font-mono inline-flex items-center">
                                <span className="text-gray-500 mr-2">[{formatTime(log.createdAt)}]</span>
                                <span className="text-gray-200 font-semibold mr-2">{log.username}</span>
                                <span className="text-emerald-400 font-bold bg-emerald-400/10 px-1.5 rounded">+Rp 5.000</span>
                                {idx < todayLogs.length - 1 && <span className="ml-4 text-gray-700">|</span>}
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="w-full text-center text-xs text-gray-500 font-medium italic">
                        Hari ini transaksi belum ada.
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-100%); }
                }
                .group:hover div[style*="animation"] {
                    animation-play-state: paused !important;
                }
            `}</style>
        </div>
    );
}

// --- 1. Chart Component (Cash Flow) ---
function CashFlowChart({ logs }) {
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const availableMonths = useMemo(() => {
        const months = new Set();
        const now = new Date();
        months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

        logs.forEach(log => {
            try {
                const d = new Date(log.createdAt);
                if (!isNaN(d.getTime())) {
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    months.add(key);
                }
            } catch (e) { }
        });
        return Array.from(months).sort().reverse();
    }, [logs]);

    const chartData = useMemo(() => {
        if (!selectedMonth) return [];
        const [yearStr, monthStr] = selectedMonth.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        const daysInMonth = new Date(year, month, 0).getDate();

        const data = Array.from({ length: daysInMonth }, (_, i) => ({
            day: i + 1,
            count: 0,
            date: new Date(year, month - 1, i + 1)
        }));

        logs.forEach(log => {
            const d = new Date(log.createdAt);
            if (d.getFullYear() === year && (d.getMonth() + 1) === month) {
                const day = d.getDate();
                if (data[day - 1]) data[day - 1].count++;
            }
        });
        return data;
    }, [logs, selectedMonth]);

    const maxVal = Math.max(...chartData.map(d => d.count), 1);

    const getMonthLabel = (yyyyMM) => {
        const [y, m] = yyyyMM.split('-');
        return new Date(y, m - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-200/60 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                    Tren Transaksi
                </h3>
                <div className="flex gap-2">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-600 outline-none border-none cursor-pointer hover:bg-gray-200 transition-colors max-w-[140px]"
                    >
                        {availableMonths.map(m => (
                            <option key={m} value={m}>{getMonthLabel(m)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Scrollable X container untuk mobile agar grafik tidak tergencet */}
            <div className="flex-1 w-full overflow-x-auto pb-4 pt-12 custom-scrollbar">
                <div className="flex items-end gap-1 sm:gap-2 h-full min-w-[600px] sm:min-w-full px-2">
                    {chartData.map((d, i) => (
                        <div
                            key={i}
                            className="flex flex-col items-center flex-1 group h-full justify-end min-w-[14px]"
                        >
                            <div className="w-full relative flex items-end justify-center h-[180px]">
                                <div
                                    className={`w-full rounded-t-sm transition-all duration-500 ease-out relative ${d.count > 0 ? 'bg-emerald-500 group-hover:bg-emerald-600' : 'bg-gray-100'}`}
                                    style={{ height: `${(d.count / maxVal) * 100}%`, minHeight: '4px' }}
                                >
                                    {/* Tooltip: Disesuaikan agar tidak terpotong di kiri/kanan */}
                                    {d.count > 0 && (
                                        <div className={`absolute bottom-full mb-2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg pointer-events-none ${i < 3 ? 'left-0' : i > chartData.length - 4 ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}>
                                            {d.count} Trx<br />
                                            <span className="text-gray-400 font-normal">{formatDate(d.date)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className="text-[9px] sm:text-[10px] text-gray-400 mt-2">{d.day}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// 2. Stat Box
function StatBox({ label, amount, percentage, isUp, icon }) {
    return (
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-200/60 flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-xs font-medium mb-1">{label}</p>
                <h4 className="text-lg sm:text-xl font-bold text-gray-900">{amount}</h4>
                <div className="flex items-center gap-1 mt-1">
                    <span className={`text-[10px] font-bold ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                        {percentage}
                    </span>
                    <svg className={`w-3 h-3 ${isUp ? 'text-emerald-500' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isUp ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                    </svg>
                </div>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {icon}
            </div>
        </div>
    )
}

// 3. Small Info Card
function SmallInfoCard({ title, value, percentage, footer, icon, color }) {
    return (
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-200/60 flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl ${color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {icon}
                </div>
                <span className="text-[10px] font-medium text-gray-400">Last 30 days</span>
            </div>
            <div>
                <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</h4>
                <div className="flex items-end gap-2">
                    <span className="text-xl sm:text-2xl font-bold text-gray-900">{value}</span>
                    <span className={`text-xs font-bold mb-1 ${percentage.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{percentage}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{footer}</p>
            </div>
        </div>
    )
}

// 4. Recent Activity List dengan Scroll & Pagination
function RecentActivityList({ logs }) {
    const [filter, setFilter] = useState('all');
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [inputValue, setInputValue] = useState('')

    useEffect(() => {
        const t = setTimeout(() => {
            setSearchQuery(inputValue)
        }, 300) // 250–400ms ideal

        return () => clearTimeout(t)
    }, [inputValue])


    useEffect(() => {
        setCurrentPage(prev => (prev !== 1 ? 1 : prev));
    }, [filter, itemsPerPage, searchQuery]);

    const filteredLogs = useMemo(() => {
        const now = new Date();
        return logs.filter(log => {
            const logDate = new Date(log.createdAt);
            let dateMatch = true;

            if (filter === 'day') {
                dateMatch = logDate.toDateString() === now.toDateString();
            } else if (filter === 'month') {
                dateMatch = logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
            }

            const searchMatch = log.username.toLowerCase().includes(searchQuery.toLowerCase());

            return dateMatch && searchMatch;
        });
    }, [logs, filter, searchQuery]);

    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(filteredLogs.length / itemsPerPage);

    const paginatedLogs = useMemo(() => {
        if (itemsPerPage === 'all') return filteredLogs;
        const start = (currentPage - 1) * itemsPerPage;
        return filteredLogs.slice(start, start + parseInt(itemsPerPage));
    }, [filteredLogs, currentPage, itemsPerPage]);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    return (
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-200/60 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
                    <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                    Recent Activity
                </h3>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto max-w-full">
                        {['all', 'month', 'day'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold capitalize transition-all whitespace-nowrap ${filter === f
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {f === 'all' ? 'All' : f === 'month' ? 'Month' : 'Today'}
                            </button>
                        ))}
                    </div>

                    <select
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(e.target.value)}
                        className="bg-gray-100 border-none text-[10px] font-bold text-gray-600 py-1.5 pl-2 pr-6 rounded-xl focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                        <option value={5}>5 Rows</option>
                        <option value={10}>10 Rows</option>
                        <option value={20}>20 Rows</option>
                        <option value="all">All</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Cari berdasarkan username..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full h-10 sm:w-auto bg-gray-100 border-none text-[10px] font-bold text-gray-600 py-1.5 px-3 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* Scroll Container untuk Mobile */}
            <div className="overflow-x-auto w-full">
                <div className="min-w-[600px]"> {/* Min-width agar tabel tidak tergencet di mobile */}
                    <div className="flex text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2 px-2">
                        <div className="w-[10%] text-center">No</div>
                        <div className="w-[40%] pl-2">User & Time</div>
                        <div className="w-[25%] text-center">Status</div>
                        <div className="w-[25%] text-right pr-2">Revenue</div>
                    </div>

                    <div className="flex-1 space-y-2">
                        {paginatedLogs.length > 0 ? (
                            paginatedLogs.map((log, idx) => {
                                const globalIndex = (itemsPerPage === 'all' ? 0 : (currentPage - 1) * itemsPerPage) + idx + 1;
                                return (
                                    <div key={log._id} className="flex items-center text-sm group hover:bg-gray-50 p-2 rounded-xl transition-colors">
                                        <div className="w-[10%] text-center text-gray-400 font-mono text-xs">
                                            {globalIndex}
                                        </div>
                                        <div className="w-[40%] flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs ${idx % 2 === 0 ? 'bg-indigo-400' : 'bg-emerald-400'}`}>
                                                {log.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 truncate text-xs sm:text-sm">{log.username}</p>
                                                <p className="text-[10px] text-gray-400 truncate">{formatDate(log.createdAt)} • {formatTime(log.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="w-[25%] text-center">
                                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">Success</span>
                                        </div>
                                        <div className="w-[25%] text-right font-bold text-gray-900 text-xs sm:text-sm">
                                            + 5K
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="text-center py-8 text-gray-400 italic text-xs">Belum ada aktivitas pada periode ini.</div>
                        )}
                    </div>
                </div>
            </div>

            {itemsPerPage !== 'all' && totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-50">
                    <p className="text-[10px] text-gray-400">
                        Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-1">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-2 py-1 text-[10px] font-bold rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                        >
                            Prev
                        </button>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-2 py-1 text-[10px] font-bold rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
// 5. My Cards / Info Widget
function MyCardsWidget({ totalRevenue }) {
    return (
        <div >
            {/* Kartu Visual */}
            <div className="relative w-full aspect-[1.6/1] bg-gradient-to-br from-[#0f172a] to-[#334155] rounded-3xl p-6 text-white shadow-xl overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                <div className="relative z-10 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start">
                        <span className="font-bold text-lg italic">VISA</span>
                        <span className="text-white/80">Business</span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-300 font-mono mb-1">**** **** **** 2104</p>
                        <h4 className="text-xl sm:text-2xl font-bold tracking-tight">{formatCurrency(totalRevenue)}</h4>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase">Card Holder</p>
                            <p className="text-xs sm:text-sm font-medium">XLToken Admin</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase">Expires</p>
                            <p className="text-xs sm:text-sm font-medium">12/28</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- MAIN PAGE ---
export default function TransactionsPage() {
    const [logs, setLogs] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [isCheckingAuth, setCheckingAuth] = useState(true)
    const [timeRange, setTimeRange] = useState('month') // 'month' or 'all'
    const router = useRouter()

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token')
            if (!token) { router.push('/auth/loginv2'); return }

            try {
                setIsLoading(true)
                const res = await api.get('/api/xltoken/gettokenlogtransactions')
                // Sort logs by date descending
                setLogs(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
            } catch (err) {
                console.error("Gagal mengambil logs:", err)
            } finally {
                setIsLoading(false); setCheckingAuth(false)
            }
        }
        fetchData()
    }, [router])

    // Listen socket
    useEffect(() => {
        socket.connect();

        socket.on("connect", () => {
            console.log("✅ socket connected", socket.id);
        });

        socket.on("log:new", (newLog) => {
            setLogs(prev => [newLog, ...prev]); // ⬅ realtime update
        });

        return () => {
            socket.off("log:new");
            socket.disconnect();
        };
    }, []);


    // --- Perhitungan Revenue ---
    const PRICE_PER_TRX = 10000;

    // Total Revenue (All Time)
    const totalRevenue = logs.length * PRICE_PER_TRX;

    // Filter Logs untuk Statistik (Berdasarkan filter dropdown)
    const filteredStatsLogs = useMemo(() => {
        if (timeRange === 'all') return logs;

        const now = new Date();
        return logs.filter(l => {
            const d = new Date(l.createdAt);
            // Cek Bulan dan Tahun yang sama
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
    }, [logs, timeRange]);

    // Total Revenue (Berdasarkan Filter) - Untuk Hero Card
    const displayedRevenue = filteredStatsLogs.length * PRICE_PER_TRX;

    // Total Transaksi (Berdasarkan Filter) - Untuk Small Card
    const displayedTransactions = filteredStatsLogs.length;

    const revenueGrowth = timeRange === 'month' ? "+15.8%" : "+45.2%";
    const transactionGrowth = timeRange === 'month' ? "+16.0%" : "+52.1%";

    const todayRevenue = useMemo(() => {
        const now = new Date();
        const count = logs.filter(l => {
            const d = new Date(l.createdAt);
            return d.toDateString() === now.toDateString();
        }).length;
        return count * PRICE_PER_TRX;
    }, [logs]);

    const thisMonthFixedRevenue = useMemo(() => {
        const now = new Date();
        const count = logs.filter(l => {
            const d = new Date(l.createdAt);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
        return count * PRICE_PER_TRX;
    }, [logs]);

    if (isCheckingAuth) return <div className="min-h-screen flex justify-center items-center bg-[#F0F2F5]"><MinimalistLoader color="bg-gray-600" /></div>

    return (
        <div className="min-h-screen bg-[#F0F2F5] font-['Poppins',_sans-serif] text-[#1A1C23] flex flex-col">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #E5E7EB; border-radius: 20px; }
            `}</style>

            <div className="flex-1 p-4 sm:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header Nav */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Financial Overview</h1>
                        <button onClick={() => router.push('/dashboardv2')} className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 bg-white px-3 sm:px-4 py-2 rounded-xl border border-gray-200 shadow-sm transition-all">
                            Back to Dashboard
                        </button>
                    </div>

                    {/* 1. Hero Card: Total Revenue (Wide Green Banner) */}
                    <div className="bg-[#047857] rounded-[1rem] sm:rounded-[2.5rem] p-4 sm:p-10 text-white mb-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-end sm:items-center gap-6">
                        {/* Deco */}
                        <div className="w-full lg:w-1/3 min-h-[100px]">
                            <MyCardsWidget totalRevenue={totalRevenue} />
                        </div>
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                        <div className="absolute bottom-0 left-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl"></div>

                        <div className="relative z-10 w-full sm:w-auto px-4">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-emerald-100 font-medium text-sm">Total Pendapatan</p>
                                {/* Filter Dropdown (Updated for Mobile Visibility) */}
                                <select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    className="bg-emerald-800/40 text-emerald-50 text-xs font-bold px-3 py-1.5 rounded-lg border-none outline-none cursor-pointer hover:bg-emerald-800/60 ml-4 transition-colors focus:ring-2 focus:ring-emerald-400"
                                >
                                    <option value="month" className="text-gray-900">Bulan Ini</option>
                                    <option value="all" className="text-gray-900">Semua Waktu</option>
                                </select>
                            </div>
                            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">{formatCurrency(displayedRevenue)}</h2>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="bg-emerald-800/50 px-2 py-1 rounded text-xs font-bold text-emerald-200">{revenueGrowth}</span>
                                <span className="text-xs text-emerald-100/70">
                                    {timeRange === 'month' ? 'dari bulan lalu' : 'pertumbuhan total'}
                                </span>
                            </div>
                        </div>

                        <div className="hidden sm:block absolute bottom-4 right-6 z-20">
                            <FlipClock size="small" />
                        </div>

                        <div className="hidden sm:block relative z-10 w-full sm:w-auto px-4">
                            <button className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm backdrop-blur-sm transition-all flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Export Laporan
                            </button>
                        </div>
                    </div>

                    {/* Running Text / Ticker */}
                    <TransactionTicker logs={logs} />

                    {isLoading ? (
                        <div className="py-20 flex justify-center"><MinimalistLoader color="bg-emerald-600" /></div>
                    ) : (
                        <>
                            {/* 2. Middle Section: Chart & Side Stats */}
                            <div className="flex flex-col lg:flex-row gap-6 mb-8">
                                {/* Left: Chart (Lebar) */}
                                <div className="flex-1 min-h-[300px]">
                                    <CashFlowChart logs={logs} />
                                </div>
                                {/* Right: Stats (Stacked) */}
                                <div className="w-full lg:w-1/3 flex flex-col gap-6">
                                    <StatBox
                                        label="Pemasukan Bulan Ini"
                                        amount={formatCurrency(thisMonthFixedRevenue)}
                                        percentage="45.0% ↗"
                                        isUp={true}
                                        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                                    />
                                    <StatBox
                                        label="Pemasukan Hari Ini"
                                        amount={formatCurrency(todayRevenue)}
                                        percentage="12.5% ↘"
                                        isUp={false}
                                        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
                                    />
                                </div>
                            </div>

                            {/* 3. Three Small Cards Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <SmallInfoCard
                                    title={`Total Transaksi (${timeRange === 'month' ? 'Bulan Ini' : 'Total'})`}
                                    value={displayedTransactions}
                                    percentage={`${transactionGrowth} ↗`}
                                    footer={timeRange === 'month' ? "vs. last month" : "Total processed"}
                                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                                    color="emerald"
                                />
                                <SmallInfoCard
                                    title="Rata-rata Harian"
                                    value={Math.round(displayedTransactions / (timeRange === 'month' ? 30 : logs.length > 0 ? 365 : 1))}
                                    percentage="+8.2% ↘"
                                    footer="vs. previous period"
                                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                                    color="blue"
                                />
                                <SmallInfoCard
                                    title="Estimasi Revenue"
                                    value={formatCurrency(displayedRevenue * 1.1)}
                                    percentage="+35.2% ↗"
                                    footer="Projection for next period"
                                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                    color="purple"
                                />
                            </div>

                            {/* 4. Bottom Section: Recent Activity & My Cards */}
                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="flex-1 min-w-0">
                                    <RecentActivityList logs={logs} />
                                </div>
                                {/* <div className="w-full lg:w-1/3 min-h-[300px]">
                                    <MyCardsWidget totalRevenue={totalRevenue} />
                                </div> */}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <footer className="w-full py-6 text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} <span className="font-semibold text-gray-700">FMP</span> — Token Manager by Faezol.
            </footer>
        </div>
    )
}