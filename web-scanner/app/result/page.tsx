'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { PrescriptionVerification } from '@/lib/supabase'
import { CheckCircle, AlertCircle, Package, User, Calendar, Pill, ArrowRight, Home, Loader2 } from 'lucide-react'

export default function ResultPage() {
  const router = useRouter()
  const [prescription, setPrescription] = useState<PrescriptionVerification | null>(null)
  const [qrToken, setQrToken] = useState<string>('')
  const [dispensing, setDispensing] = useState(false)
  const [dispensed, setDispensed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('prescription')
    const token = sessionStorage.getItem('qr_token')
    
    if (!stored || !token) {
      router.push('/')
      return
    }

    const data: PrescriptionVerification = JSON.parse(stored)
    setPrescription(data)
    setQrToken(token)
  }, [router])

  const handleDispense = async () => {
    if (!prescription || !qrToken || dispensing || dispensed) return

    try {
      setDispensing(true)
      setError(null)

      // Call edge function with dispense action
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/verify_qr_and_lock`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            token: qrToken, // Use the actual QR token from scan
            action: 'dispense'
          })
        }
      )

      const result = await response.json()

      console.log('Dispense response:', result) // Debug log

      if (response.ok && result.valid) {
        setDispensed(true)
        sessionStorage.removeItem('prescription')
        sessionStorage.removeItem('qr_token')
        
        // Auto redirect after 5 seconds
        setTimeout(() => {
          router.push('/')
        }, 5000)
      } else {
        setError(result.error || 'Gagal mengeluarkan obat')
      }
    } catch (err: unknown) {
      console.error('Dispense error:', err)
      setError('Terjadi kesalahan saat mengeluarkan obat')
    } finally {
      setDispensing(false)
    }
  }

  if (!prescription) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (dispensed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900 dark:to-emerald-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Obat Berhasil Dikeluarkan!
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Silakan ambil obat Anda dari vending machine
          </p>

          <div className="space-y-3">
            <Link href="/">
              <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <Home className="w-5 h-5" />
                Kembali ke Beranda
              </button>
            </Link>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Otomatis kembali dalam 5 detik...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Success Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Resep Valid!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Silakan verifikasi detail resep di bawah
          </p>
        </div>

        {/* Prescription Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="p-6 bg-blue-600 text-white">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6" />
              Detail Resep
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Doctor Info */}
            <div className="flex items-start gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <User className="w-5 h-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Dokter</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {prescription.prescription.doctor.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  SIP: {prescription.prescription.doctor.license_number}
                </p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <Calendar className="w-5 h-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Tanggal Resep</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(prescription.prescription.issued_at).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Medicine Items */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Pill className="w-5 h-5 text-gray-400" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Daftar Obat
                </p>
              </div>
              
              <div className="space-y-3">
                {prescription.items.map((item, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {item.medicine.name}
                      </h3>
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                        {item.total_quantity} {item.medicine.form}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {item.medicine.generic_name} - {item.medicine.strength}
                    </p>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <p><span className="font-medium">Dosis:</span> {item.dosage}</p>
                      <p><span className="font-medium">Frekuensi:</span> {item.frequency}</p>
                      <p><span className="font-medium">Durasi:</span> {item.duration_days} hari</p>
                      <p><span className="font-medium">Aturan Pakai:</span> {item.instructions}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link href="/" className="flex-1">
            <button className="w-full px-6 py-4 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
              <Home className="w-5 h-5" />
              Batal
            </button>
          </Link>
          
          <button
            onClick={handleDispense}
            disabled={dispensing}
            className="flex-1 px-6 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {dispensing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Mengeluarkan Obat...
              </>
            ) : (
              <>
                Keluarkan Obat
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Warning */}
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-semibold">Perhatian:</span> QR Code hanya dapat digunakan satu kali. 
            Setelah obat dikeluarkan, resep ini tidak dapat digunakan lagi.
          </p>
        </div>
      </div>
    </div>
  )
}
