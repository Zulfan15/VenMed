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
    if (!prescription || !qrToken || dispensing) return

    try {
      setDispensing(true)
      setError(null)

      // Call edge function with dispense action
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Environment variables not configured')
      }

      console.log('Dispensing with token:', qrToken)
      console.log('Calling:', `${supabaseUrl}/functions/v1/verify_qr_and_lock`)

      const response = await fetch(
        `${supabaseUrl}/functions/v1/verify_qr_and_lock`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            token: qrToken,
            action: 'dispense'
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('HTTP Error:', response.status, errorText)
        throw new Error(`Server error: ${response.status}`)
      }

      const result = await response.json()

      console.log('Dispense response:', result) // Debug log

      if (response.ok && result.valid) {
        // Prepare receipt data
        const receiptData = {
          prescription_id: prescription.prescription.id,
          patient_name: prescription.prescription.patient_name,
          doctor_name: prescription.prescription.doctor.name,
          doctor_license: prescription.prescription.doctor.license_number,
          issued_at: prescription.prescription.issued_at,
          dispensed_at: new Date().toISOString(),
          diagnosis: prescription.prescription.diagnosis,
          items: prescription.items.map(item => ({
            medicine_name: item.medicine.name,
            generic_name: item.medicine.generic_name,
            strength: item.medicine.strength,
            dosage: item.dosage,
            frequency: item.frequency,
            duration_days: item.duration_days,
            total_quantity: item.total_quantity,
            instructions: item.instructions
          }))
        }

        // Save receipt data
        sessionStorage.setItem('receipt', JSON.stringify(receiptData))
        sessionStorage.removeItem('prescription')
        sessionStorage.removeItem('qr_token')
        
        // Redirect to receipt page
        router.push('/receipt')
      } else {
        setError(result.error || 'Gagal mengeluarkan obat')
      }
    } catch (err: unknown) {
      console.error('Dispense error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengeluarkan obat'
      setError(errorMessage)
    } finally {
      setDispensing(false)
    }
  }

  if (!prescription) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-900 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Success Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Resep Valid!
          </h1>
          <p className="text-slate-600">
            Silakan verifikasi detail resep di bawah
          </p>
        </div>

        {/* Prescription Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="p-6 bg-blue-900 text-white">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6" />
              Detail Resep
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Doctor Info */}
            <div className="flex items-start gap-3 pb-4 border-b border-slate-200">
              <User className="w-5 h-5 text-slate-400 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-slate-500">Dokter</p>
                <p className="text-lg font-semibold text-slate-800">
                  {prescription.prescription.doctor.name}
                </p>
                <p className="text-sm text-slate-600">
                  SIP: {prescription.prescription.doctor.license_number}
                </p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-3 pb-4 border-b border-slate-200">
              <Calendar className="w-5 h-5 text-slate-400 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-slate-500">Tanggal Resep</p>
                <p className="text-lg font-semibold text-slate-800">
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
                <Pill className="w-5 h-5 text-slate-400" />
                <p className="text-sm font-semibold text-slate-800">
                  Daftar Obat
                </p>
              </div>
              
              <div className="space-y-3">
                {prescription.items.map((item, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-slate-50 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-slate-800">
                        {item.medicine.name}
                      </h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-sm font-medium">
                        {item.total_quantity} {item.medicine.form}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {item.medicine.generic_name} - {item.medicine.strength}
                    </p>
                    <div className="text-sm text-slate-500">
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              {error}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link href="/" className="flex-1">
            <button className="w-full px-6 py-4 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
              <Home className="w-5 h-5" />
              Batal
            </button>
          </Link>
          
          <button
            onClick={handleDispense}
            disabled={dispensing}
            className="flex-1 px-6 py-4 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {dispensing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Memproses...
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
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Perhatian:</span> QR Code hanya dapat digunakan satu kali. 
            Setelah obat dikeluarkan, resep ini tidak dapat digunakan lagi.
          </p>
        </div>
      </div>
    </div>
  )
}
