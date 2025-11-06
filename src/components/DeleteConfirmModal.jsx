import React from 'react';

export default function DeleteConfirmModal({ open, onCancel, onConfirm, fileName, loading }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Konfirmasi Hapus</h3>
                <p className="mb-6 text-gray-600">Yakin ingin menghapus file <span className="font-bold break-words">{fileName}</span>?</p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                        disabled={loading}
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition font-semibold disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Menghapus...' : 'Hapus'}
                    </button>
                </div>
            </div>
        </div>
    );
} 