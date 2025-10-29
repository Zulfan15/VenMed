'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Calendar, FileText, Pill, Clock, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PrescriptionDetail {
  id: string
  patient_name: string
  patient_age?: number
  patient_gender?: string
  diagnosis?: string
  notes?: string
  status: string
  issued_at: string
  expires_at: string
  dispensed_at?: string
  doctor: {
    name: string
    license_number: string
  }
  items: Array<{
    id: string
    dosage: string
    frequency: string
    duration_days: number
    total_quantity: number
    instructions: string
    medicine: {
      name: string
      generic_name: string
      strength: string
      form: string
    }
  }>
}

export default function PrescriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const unwrappedParams = use(params)
  const [prescription, setPrescription] = useState<PrescriptionDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPrescriptionDetail()
  }, [unwrappedParams.id])

  const fetchPrescriptionDetail = async () => {
    try {
      // Fetch prescription with doctor and items
      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('prescriptions')
        .select(`
          *,
          doctors!inner(name, license_number)
        `)
        .eq('id', unwrappedParams.id)
        .single()

      if (prescriptionError) throw prescriptionError

      // Fetch prescription items with medicines
      const { data: itemsData, error: itemsError } = await supabase
        .from('prescription_items')
        .select(`
          *,
          medicines!inner(name, generic_name, strength, form)
        `)
        .eq('prescription_id', unwrappedParams.id)

      if (itemsError) throw itemsError

      setPrescription({
        ...prescriptionData,
        doctor: prescriptionData.doctors,
        items: itemsData.map(item => ({
          ...item,
          medicine: item.medicines
        }))
      })
    } catch (error) {
      console.error('Error fetching prescription:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      issued: { color: 'bg-blue-100 text-blue-800', text: 'Terbit' },
      dispensed: { color: 'bg-green-100 text-green-800', text: 'Sudah Diambil' },
      expired: { color: 'bg-gray-100 text-gray-800', text: 'Kadaluarsa' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Dibatalkan' }
    }
    const { color, text } = config[status] || config.issued
    return <span className={`px-3 py-1 rounded-full text-sm font-semibold ${color}`}>{text}</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!prescription) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Resep tidak ditemukan</p>
          <Link href="/prescription/history">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
              Kembali ke Riwayat
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/prescription/history">
            <button type="button" aria-label="Kembali ke Riwayat" title="Kembali ke Riwayat" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Detail Resep
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              ID: {prescription.id.substring(0, 8)}...
            </p>
          </div>
          {getStatusBadge(prescription.status)}
        </div>

        {/* Patient Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {prescription.patient_name || 'Pasien Anonim'}
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                {prescription.patient_age && <span>Usia: {prescription.patient_age} tahun</span>}
                {prescription.patient_gender && <span>Jenis Kelamin: {prescription.patient_gender}</span>}
              </div>
            </div>
          </div>

          {prescription.diagnosis && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Diagnosis:</p>
              <p className="text-gray-900 dark:text-white">{prescription.diagnosis}</p>
            </div>
          )}

          {prescription.notes && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Catatan:</p>
              <p className="text-gray-900 dark:text-white">{prescription.notes}</p>
            </div>
          )}
        </div>

        {/* Doctor Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Informasi Dokter
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Nama:</span>
              <span className="font-medium text-gray-900 dark:text-white">{prescription.doctor.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">SIP:</span>
              <span className="font-medium text-gray-900 dark:text-white">{prescription.doctor.license_number}</span>
            </div>
          </div>
        </div>

        {/* Prescription Items */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Pill className="w-5 h-5" />
            Daftar Obat ({prescription.items.length})
          </h3>
          <div className="space-y-4">
            {prescription.items.map((item, index) => (
              <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {index + 1}. {item.medicine.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.medicine.generic_name} - {item.medicine.strength}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                    {item.total_quantity} {item.medicine.form}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p><span className="font-medium">Dosis:</span> {item.dosage}</p>
                  <p><span className="font-medium">Frekuensi:</span> {item.frequency}</p>
                  <p><span className="font-medium">Durasi:</span> {item.duration_days} hari</p>
                  <p><span className="font-medium">Aturan Pakai:</span> {item.instructions}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Timeline
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Resep Diterbitkan</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(prescription.issued_at)}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Berlaku Sampai</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(prescription.expires_at)}</p>
              </div>
            </div>

            {prescription.dispensed_at && (
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Obat Diambil</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(prescription.dispensed_at)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Link href="/prescription/history" className="flex-1">
            <button className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors">
              Kembali
            </button>
          </Link>
          {prescription.status === 'issued' && (
            <Link href={`/prescription/qr/${prescription.id}`} className="flex-1">
              <button className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
                Lihat QR Code
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
