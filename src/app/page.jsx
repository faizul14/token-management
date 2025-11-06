'use client'
import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  timeout: 30000,
  headers: {
    'Accept': '*/*',
  }
})

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

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()
  const [downloadUrl, setDownloadUrl] = useState('');


  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setMessage('Pilih file terlebih dahulu')
      return
    }

    // Validasi ukuran file (maksimal 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB dalam bytes
    if (file.size > maxSize) {
      setError('Ukuran file terlalu besar. Maksimal 10MB.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    // Optional: log isi FormData
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1])
    }

    try {
      setIsLoading(true)
      setError(null)
      console.log('Starting upload...', file.name)

      const response = await api.post('/api/public/files/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          console.log('Upload Progress:', percentCompleted)
        }
      })

      console.log('Upload response:', response.data)
      setMessage('Upload berhasil!')
      setDownloadUrl(response.data.url); // Simpan URL dari response upload
      setFile(null)

      // Redirect ke halaman utama setelah 2 detik
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (err) {
      console.error('Upload error:', err)
      if (err.response) {
        const errorMessage = err.response.data.message || 'Terjadi kesalahan pada server'
        console.error('Server error:', errorMessage)
        setError(`Upload gagal: ${errorMessage}`)
      } else if (err.request) {
        console.error('Network error:', err.request)
        setError('Upload gagal: Tidak ada response dari server. Periksa koneksi internet Anda.')
      } else {
        console.error('Error:', err.message)
        setError(`Upload gagal: ${err.message}`)
      }
      setMessage('Upload gagal!')
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
                  Ikat File
                </h1>

                <form onSubmit={handleUpload} className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="file"
                        onChange={(e) => {
                          const selectedFile = e.target.files[0]
                          if (selectedFile) {
                            console.log('Selected file:', {
                              name: selectedFile.name,
                              type: selectedFile.type,
                              size: selectedFile.size
                            })
                            setFile(selectedFile)
                          }
                        }}
                        className="block w-full text-sm text-white
                                        file:mr-4 file:py-2 sm:file:py-3 file:px-4
                                        file:rounded-lg file:border-0
                                        file:text-sm file:font-medium
                                        file:bg-gray-600/50 file:text-white
                                        hover:file:bg-gray-600/70
                                        file:shadow-lg
                                        file:transition-all file:duration-200"
                        disabled={isLoading}
                      />
                    </div>

                    {file && (
                      <div className="bg-gray-700/30 rounded-lg p-3 sm:p-4  border border-gray-600/30">
                        <p className="text-sm text-white break-words">
                          Selected file: {file.name}
                        </p>
                        <p className="text-xs text-gray-300 mt-1">
                          Size: {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    )}
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
                      {isLoading ? 'Uploading...' : 'Upload File'}
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
                  <div className="p-3 sm:p-4 text-center">
                    <p className="text-white/90 text-sm">Maksimal ukuran file 10MB</p>
                  </div>

                  {error && (
                    <div className="p-3 sm:p-4 bg-gray-700/30 rounded-lg  border border-gray-600/30">
                      <p className="text-white/90 text-sm">{error}</p>
                    </div>
                  )}

                  {message && (
                    <div className="p-3 sm:p-4 bg-gray-700/30 rounded-lg  border border-gray-600/30">
                      <p className="text-white text-sm">{message}</p>
                    </div>
                  )}
                  {downloadUrl && (
                    <div className="p-3 sm:p-4 bg-gray-700/30 rounded-lg border border-gray-600/30 mt-2 text-white/90 text-sm">
                      <p>Link download:</p>
                      <div className="mt-1 flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                        <div className="flex-1 break-all text-blue-400">
                          <span className="text-blue-400 cursor-text hover:underline">
                            {downloadUrl}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(downloadUrl)
                              .then(() => {
                                setMessage('Link berhasil disalin!');
                                setTimeout(() => setMessage('Upload berhasil!'), 2000)
                              });
                          }}
                          className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-3 py-1.5 rounded-md transition-all"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Tempel link di browser untuk unduh otomatis</p>
                    </div>
                  )}


                </form>
              </div>
            </div>
          </div>
        </div>
        <footer className="w-full mt-0 py-6 text-center text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} <span className="font-semibold text-gray-700">FMP</span> — Personal File Manager by Faezol.
          </p>
        </footer>

      </div>
    </>
  )
}
