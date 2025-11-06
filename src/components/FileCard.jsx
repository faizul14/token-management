'use client';

import { useState } from 'react';
import Image from 'next/image';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function FileCard({ file, onDelete }) {
    const [isHovered, setIsHovered] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isImage = file.type?.startsWith('image/');

    const handleDownload = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(file.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    const handlePreviewClick = () => {
        setShowPreview(true);
        setIsImageLoading(true);
        setImageError(false);
    };

    const handleDeleteConfirm = async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/files/${file.id}`, {
                method: 'DELETE',
                headers: {
                    'Bearer': token,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) throw new Error('Gagal menghapus file');
            if (onDelete) onDelete(file.id);
            setShowDeleteModal(false);
        } catch (err) {
            alert('Gagal menghapus file');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div
                className="relative p-4 bg-white/40 border border-white/50 
                rounded-xl shadow-sm hover:shadow-md transition-all duration-300
                hover:bg-black/5 hover:border-white/70 md:w-95"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="flex flex-wrap md:flex-nonwrap items-center gap-3">
                    {isImage ? (
                        <div className="relative w-12 h-22 md:w-22 md:h-42 rounded-lg overflow-hidden bg-white/30">
                            <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover"
                                onError={() => setImageError(true)}
                            />
                        </div>
                    ) : (
                        <div className="p-2 bg-white/30 rounded-lg">
                            <svg
                                className="w-6 h-6 text-gray-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        </div>
                    )}
                    <div className="flex-1">
                        <h3 className="font-medium text-gray-800 text-sm truncate max-w-[160px] sm:max-w-full md:max-w-[160px]">{file.name}</h3>
                        <p className="text-sm text-gray-600">{file.size}</p>
                        <p className="text-xs text-gray-500">{file.date}</p>
                    </div>
                    {isHovered && (
                        <div className="flex flex-col gap-2 ml-auto">
                            {isImage && (
                                <button
                                    onClick={handlePreviewClick}
                                    className="p-1.5 text-gray-600 hover:text-gray-800 
                                    bg-white/30 hover:bg-white/50 rounded-lg
                                    transition-all duration-200"
                                    title="Preview"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </button>
                            )}
                            <button
                                onClick={handleDownload}
                                className="p-1.5 text-gray-600 hover:text-gray-800 
                                bg-white/30 hover:bg-white/50 rounded-lg
                                transition-all duration-200"
                                title="Download"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>
                            <button
                                // onClick={handleDelete}
                                onClick={() => setShowDeleteModal(true)}
                                disabled={isDeleting}
                                className={`p-1.5 text-red-500 hover:text-white bg-red-100 hover:bg-red-500 rounded-lg transition-all duration-200 border border-red-200 ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Delete"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Konfirmasi Hapus (baru) */}
            <DeleteConfirmModal
                open={showDeleteModal}
                onCancel={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteConfirm}
                fileName={file.name}
                loading={isDeleting}
            />

            {/* Image Preview Modal */}
            {showPreview && isImage && (
                <div
                    className="fixed inset-0   flex items-center justify-center z-50 bg-black/20"
                    onClick={() => setShowPreview(false)}
                >
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="relative bg-white/10 rounded-xl overflow-hidden border border-white/20 shadow-2xl">
                            {isImageLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                                </div>
                            )}
                            {imageError ? (
                                <div className="flex items-center justify-center bg-black/10 px-8 py-12">
                                    <p className="text-white">Gagal memuat gambar</p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center">
                                    <img
                                        src={file.url}
                                        alt={file.name}
                                        className="max-w-full max-h-[80vh] object-contain"
                                        onLoad={() => setIsImageLoading(false)}
                                        onError={() => {
                                            setIsImageLoading(false);
                                            setImageError(true);
                                        }}
                                    />
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="absolute top-4 right-4 text-white 
                    bg-black/20 hover:bg-black/40 rounded-full p-3 
                    backdrop-blur-md border border-white/10
                    hover:border-white/20 transition-all duration-200 z-20"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}
        </>
    );
}