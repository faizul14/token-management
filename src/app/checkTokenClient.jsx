'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'


// Konfigurasi API
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000',
  timeout: 30000,
  headers: { 'Accept': '*/*' }
})

// Loader Minimalis
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

// Kartu Paket Harga (Updated: WhatsApp Redirect)
function PricingCard({ title, price, unit, features, gradient, icon, popular }) {

  const handleBuy = () => {
    const phoneNumber = '6287863620819'; // Nomor tujuan
    // Format pesan WA
    const message = `Halo Admin XLToken, saya tertarik untuk membeli paket ini:\n\n*${title}*\nHarga: ${price} ${unit}\n\nMohon informasi pembayaran lebih lanjut. Terima kasih.`;

    // Encode pesan agar aman di URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // Buka tab baru ke WA
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-lg ${gradient} text-white transition-transform hover:-translate-y-1 border border-white/10`}>
      {/* Decorative Circle */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              {icon}
            </div>
            {popular && <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10">Popular / Tidak Tersedia</span>}
          </div>

          <h3 className="text-lg font-bold opacity-90 mb-1">{title}</h3>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight">{price}</span>
            <span className="text-sm font-medium opacity-80">{unit}</span>
          </div>
          <ul className="space-y-3 mb-8">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3 text-sm font-medium">
                <div className="p-0.5 rounded-full bg-white/20 flex-shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        {/* Tombol Buy diperbarui dengan onClick */}
        <button
          onClick={handleBuy}
          className="w-full py-3.5 bg-white text-gray-900 font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-all active:scale-95 text-sm uppercase tracking-wider flex justify-center items-center gap-2"
        >
          <span>Beli Sekarang</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </div>
    </div>
  )
}

// Komponen Info Slider Baru (Updated: Fetch from API)
function InfoSlider() {
  const [infos, setInfos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Data Informasi
  useEffect(() => {
    const fetchInfos = async () => {
      try {
        // Mengambil data dari endpoint public
        const res = await api.get('/api/public/xlinformation/getinformation');
        // Sort data terbaru di depan
        const sortedData = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setInfos(sortedData);
      } catch (err) {
        console.error("Gagal mengambil informasi:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInfos();
  }, []);

  // Logic Slider Otomatis
  useEffect(() => {
    if (infos.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % infos.length);
        setIsAnimating(false);
      }, 300);
    }, 10000);

    return () => clearInterval(interval);
  }, [infos.length]);

  // Render Loading atau Null jika tidak ada data
  if (isLoading) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-8 min-h-[130px] flex items-center justify-center">
        <MinimalistLoader />
      </div>
    );
  }

  if (infos.length === 0) return null;

  const currentItem = infos[currentIndex];

  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-8 relative min-h-[130px] flex flex-col">
      {/* Ikon Background Tetap */}
      <div className="absolute top-2 right-2 opacity-20 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <div className="relative z-10 w-full flex-1 flex flex-col">
        <h4 className="text-emerald-800 font-bold mb-3 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Informasi Penting
        </h4>

        {/* Kontainer Konten yang Elastis */}
        <div
          className={`flex-1 transition-opacity duration-300 ease-in-out ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
        >
          <p className="text-sm text-emerald-700 text-justify leading-relaxed whitespace-pre-wrap">
            {currentItem.information}
          </p>
          <p className="text-xs text-emerald-500 mt-2 font-medium text-right">
            {new Date(currentItem.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Indikator Dots */}
        {infos.length > 1 && (
          <div className="flex gap-1.5 mt-4 justify-center">
            {infos.slice(0, 5).map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex ? 'w-4 bg-emerald-400' : 'w-1.5 bg-emerald-200'}`}
              ></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Komponen Card Hasil Pengecekan (Updated: Transaction Limit Logic)
function TokenInfoCard({ token }) {
  const isActive = token.isactive;
  const isExpired = new Date(token.expiredAt) < new Date();
  const now = new Date();
  const diffTime = new Date(token.expiredAt).getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const limit = token.transactionslimit !== undefined ? token.transactionslimit : 0;

  // --- Logic Warna Status ---
  let statusBadge;
  if (!isActive) {
    statusBadge = <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-red-100 text-red-800">REVOKED</span>;
  } else if (isExpired) {
    statusBadge = <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-orange-100 text-orange-800">EXPIRED</span>;
  } else {
    statusBadge = <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-green-100 text-green-800">ACTIVE</span>;
  }

  // --- Logic Warna Limit Transaksi ---
  let limitClass = "text-emerald-600";
  let limitBg = "bg-emerald-50 border-emerald-100";
  let limitTitle = "text-emerald-800";

  if (limit <= 0) {
    limitClass = "text-red-600";
    limitBg = "bg-red-50 border-red-100";
    limitTitle = "text-red-800";
  } else if (limit <= 10) { // Ambang batas kuning (sedikit)
    limitClass = "text-orange-600";
    limitBg = "bg-orange-50 border-orange-100";
    limitTitle = "text-orange-800";
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

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        {/* Card Sisa Waktu */}
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col justify-between">
          <p className="text-emerald-800 font-medium mb-1">Sisa Waktu</p>
          <p className={`text-2xl font-bold ${diffDays <= 7 ? 'text-orange-600' : 'text-emerald-600'}`}>
            {/* {isActive && !isExpired ? `${diffDays} Hari` : '-'} */}
            {isActive && !isExpired ? diffDays >= 100 ? <span className="text-xs sm:text-2xl sm:font-bold font-medium opacity-70">Unlimited <span className='text-2xl font-bold'>Hari</span></span> : `${diffDays} Hari` : '-'}
          </p>
        </div>

        {/* Card Limit Transaksi */}
        <div className={`${limitBg} p-4 rounded-2xl border flex flex-col justify-between`}>
          <p className={`${limitTitle} font-medium mb-1`}>Sisa Limit</p>
          <p className={`text-2xl font-bold ${limitClass}`}>
            {limit} <span className="text-xs font-medium opacity-70">x Transaksi</span>
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500 text-xs mb-1">Dibuat Pada</p>
          <p className="font-medium text-gray-900">
            {new Date(token.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs mb-1">Kadaluwarsa</p>
          <p className="font-medium text-gray-900">
            {new Date(token.expiredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckTokenPageV2() {
  const [tokenInput, setTokenInput] = useState('')
  const [tokenData, setTokenData] = useState(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const mainColor = 'bg-emerald-600';
  const mainColorHover = 'hover:bg-emerald-700';
  const textColor = 'text-emerald-600';

  const checkTokenGeneral = async (tokenValue) => {
    setIsLoading(true)
    setError(null)
    setMessage('')
    setTokenData(null)

    try {
      const response = await api.post(
        '/api/public/xltoken/publicchecktoken',
        { token: tokenValue }
      )

      const tokenInfo = response.data.data || response.data

      if (tokenInfo && tokenInfo.username && tokenInfo.expiredAt) {
        setTokenData(tokenInfo)
        setMessage(response.data.message || 'Token berhasil ditemukan.')
      } else {
        setError(response.data.message || 'Token valid, tapi data tidak lengkap.')
      }
    } catch (err) {
      setError(
        `Pengecekan gagal: ${err.response?.data?.message || err.message || 'Terjadi kesalahan'
        }`
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckToken = async (e) => {
    e.preventDefault()
    if (!tokenInput) return setError('Silakan masukkan token terlebih dahulu')
    checkTokenGeneral(tokenInput)
  }

  useEffect(() => {
    const urlToken = searchParams.get('token')

    if (urlToken) {
      setTokenInput(urlToken)

      // auto trigger check
      checkTokenGeneral(urlToken)
    }
  }, [searchParams])


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

      <div className="flex-1 flex items-center justify-center p-4 pb-10">
        <div className="w-full max-w-4xl"> {/* Max width diperbesar untuk menampung Pricing Cards */}
          <div className="bg-white rounded-[30px] shadow-2xl p-8 sm:p-10 relative overflow-hidden mb-8">
            {/* Hiasan Background */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

            <div className="relative z-10 max-w-md mx-auto"> {/* Form tetap centered dan max-w-md */}
              {/* --- Info Slider Ditambahkan di sini --- */}
              <InfoSlider />
              {/* --------------------------------------- */}

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

          {/* --- Pricing Section (Public) --- */}
          <div className="mt-12 mb-0">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Pilihan Paket Token</h2>
              <p className="text-gray-500 mt-1">Pilih paket yang sesuai dengan kebutuhan bisnis Anda.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PricingCard
                title="TOKEN UNLIMITED"
                price="200K"
                unit="/ bulan"
                features={["Unlimited Transaksi", "Prioritas Support", "Masa Aktif 30 Hari"]}
                gradient="bg-gradient-to-br from-indigo-600 to-purple-700"
                popular={true}
                icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              />
              <PricingCard
                title="TOKEN UMKM"
                price="5K"
                unit="/ transaksi"
                features={["Bayar per Transaksi", "Cocok untuk Pemula", "Masa Aktif Fleksibel"]}
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
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