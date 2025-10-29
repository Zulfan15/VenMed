'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, FileText, CheckCircle, XCircle, Clock, LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Doctor {
  id: string
  name: string
}

interface Prescription {
  id: string
  patient_name: string
  patient_age: number
  diagnosis: string
  status: string
  issued_at: string
  expires_at: string
}

export default function PrescriptionHistory() {
  const router = useRouter()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [doctor, setDoctor] = useState<Doctor | null>(null)

  useEffect(() => {
    // Check if doctor is logged in
    const storedDoctor = localStorage.getItem('doctor')
    if (!storedDoctor) {
      router.push('/login')
      return
    }

    const doctorData = JSON.parse(storedDoctor)
    setDoctor(doctorData)
    fetchPrescriptions(doctorData.id)
  }, [router])

  const fetchPrescriptions = async (doctorId: string) => {
    try {
      // Filter by logged-in doctor
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('issued_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching prescriptions:', error)
      } else {
        setPrescriptions(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    type StatusIcon = typeof Clock | typeof CheckCircle | typeof XCircle
    
    const statusConfig: Record<string, { icon: StatusIcon; color: string; text: string }> = {
      issued: { icon: Clock, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', text: 'Terbit' },
      dispensed: { icon: CheckCircle, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', text: 'Sudah Diambil' },
      expired: { icon: XCircle, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', text: 'Kadaluarsa' },
      cancelled: { icon: XCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', text: 'Dibatalkan' }
    }

    const config = statusConfig[status] || statusConfig.issued
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/" aria-label="Kembali ke beranda">
            <button type="button" aria-label="Kembali ke beranda" title="Kembali ke beranda" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Riwayat Resep
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Daftar semua resep yang telah dibuat
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {prescriptions.filter(p => p.status === 'issued').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Aktif</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {prescriptions.filter(p => p.status === 'dispensed').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sudah Diambil</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {prescriptions.filter(p => p.status === 'expired').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Kadaluarsa</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {prescriptions.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </div>
        </div>

        {/* Prescription List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Belum ada resep dibuat</p>
              <Link href="/prescription/new">
                <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Buat Resep Pertama
                </button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {prescription.patient_name || 'Pasien Anonim'}
                        </h3>
                        {prescription.patient_age && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {prescription.patient_age} tahun
                          </p>
                        )}
                        {prescription.diagnosis && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Diagnosis: {prescription.diagnosis}
                          </p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(prescription.status)}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 ml-13">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(prescription.issued_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Berlaku sampai: {new Date(prescription.expires_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link href={`/prescription/${prescription.id}`}>
                      <button className="px-4 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50">
                        Lihat Detail
                      </button>
                    </Link>
                    {prescription.status === 'issued' && (
                      <Link href={`/prescription/qr/${prescription.id}`}>
                        <button className="px-4 py-2 text-sm bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50">
                          Lihat QR Code
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
