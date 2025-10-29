'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, FileText, LogOut, Plus, History } from 'lucide-react'

interface Doctor {
  id: string
  name: string
  license_number: string
  email: string
  phone?: string
}

export default function DashboardPage() {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [doctor, setDoctor] = useState<Doctor | null>(() => {
    // Initialize state from localStorage
    if (typeof window !== 'undefined') {
      const storedDoctor = localStorage.getItem('doctor')
      return storedDoctor ? JSON.parse(storedDoctor) : null
    }
    return null
  })

  useEffect(() => {
    // Check if doctor is logged in
    if (!doctor) {
      router.push('/login')
    }
  }, [doctor, router])

  const handleLogout = () => {
    localStorage.removeItem('doctor')
    router.push('/login')
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {doctor.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  SIP: {doctor.license_number}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard Dokter
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kelola resep digital Anda
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Create Prescription Card */}
          <Link href="/prescription/new">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                  <Plus className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Buat Resep Baru
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Buat resep digital untuk pasien dan generate QR Code
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* View History Card */}
          <Link href="/prescription/history">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                  <History className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Riwayat Resep
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Lihat semua resep yang sudah dibuat
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Tentang Sistem
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Sistem ini memungkinkan Anda membuat resep digital yang dapat di-scan 
                di Smart Medical Vending Machine. Setiap resep akan menghasilkan QR Code 
                unik yang hanya dapat digunakan satu kali untuk keamanan.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
