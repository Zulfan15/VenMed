'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, FileText, CheckCircle, XCircle, Clock, Search, Filter, X, Ban } from 'lucide-react'
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

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

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
        .limit(100)

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

  // Cancel prescription function
  const cancelPrescription = async (prescriptionId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan resep ini? Tindakan ini tidak dapat dibatalkan.')) {
      return
    }

    setCancellingId(prescriptionId)
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({ status: 'cancelled' })
        .eq('id', prescriptionId)

      if (error) throw error

      // Update local state
      setPrescriptions(prev => 
        prev.map(p => p.id === prescriptionId ? { ...p, status: 'cancelled' } : p)
      )
      
      alert('Resep berhasil dibatalkan')
    } catch (error) {
      console.error('Error cancelling prescription:', error)
      alert('Gagal membatalkan resep')
    } finally {
      setCancellingId(null)
    }
  }

  // Filtered prescriptions using useMemo for performance
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter(prescription => {
      // Search filter (patient name or diagnosis)
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = prescription.patient_name?.toLowerCase().includes(query)
        const matchesDiagnosis = prescription.diagnosis?.toLowerCase().includes(query)
        if (!matchesName && !matchesDiagnosis) return false
      }

      // Status filter
      if (statusFilter !== 'all' && prescription.status !== statusFilter) {
        return false
      }

      // Date range filter
      if (dateFrom) {
        const prescriptionDate = new Date(prescription.issued_at)
        const fromDate = new Date(dateFrom)
        if (prescriptionDate < fromDate) return false
      }

      if (dateTo) {
        const prescriptionDate = new Date(prescription.issued_at)
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999) // Include the whole day
        if (prescriptionDate > toDate) return false
      }

      return true
    })
  }, [prescriptions, searchQuery, statusFilter, dateFrom, dateTo])

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  // Check if any filter is active
  const hasActiveFilters = searchQuery || statusFilter !== 'all' || dateFrom || dateTo

  const getStatusBadge = (status: string) => {
    type StatusIcon = typeof Clock | typeof CheckCircle | typeof XCircle
    
    const statusConfig: Record<string, { icon: StatusIcon; color: string; text: string }> = {
      issued: { icon: Clock, color: 'bg-blue-100 text-blue-900', text: 'Terbit' },
      dispensed: { icon: CheckCircle, color: 'bg-green-100 text-green-800', text: 'Sudah Diambil' },
      expired: { icon: XCircle, color: 'bg-slate-100 text-slate-600', text: 'Kadaluarsa' },
      cancelled: { icon: XCircle, color: 'bg-red-100 text-red-700', text: 'Dibatalkan' }
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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard" aria-label="Kembali ke dashboard">
            <button type="button" aria-label="Kembali ke dashboard" title="Kembali ke dashboard" className="p-2 hover:bg-slate-200 rounded-lg text-slate-600">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Riwayat Resep
            </h1>
            <p className="text-slate-600">
              Daftar semua resep yang telah dibuat
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
            <div className="text-2xl font-bold text-blue-900">
              {prescriptions.filter(p => p.status === 'issued').length}
            </div>
            <div className="text-sm text-slate-600">Aktif</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
            <div className="text-2xl font-bold text-green-600">
              {prescriptions.filter(p => p.status === 'dispensed').length}
            </div>
            <div className="text-sm text-slate-600">Sudah Diambil</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
            <div className="text-2xl font-bold text-slate-500">
              {prescriptions.filter(p => p.status === 'expired').length}
            </div>
            <div className="text-sm text-slate-600">Kadaluarsa</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
            <div className="text-2xl font-bold text-slate-800">
              {prescriptions.length}
            </div>
            <div className="text-sm text-slate-600">Total</div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pasien atau diagnosis..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent bg-white text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Status Filter */}
            <select
              title="Filter Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent bg-white text-slate-800"
            >
              <option value="all">Semua Status</option>
              <option value="issued">Aktif</option>
              <option value="dispensed">Sudah Diambil</option>
              <option value="expired">Kadaluarsa</option>
              <option value="cancelled">Dibatalkan</option>
            </select>

            {/* Toggle Advanced Filters */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-50 border-blue-900 text-blue-900'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filter
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-blue-900 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Advanced Filters (Collapsible) */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    title="Filter dari tanggal"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    title="Filter sampai tanggal"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent bg-white text-slate-800"
                  />
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Reset Filter
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filter Results Info */}
          {hasActiveFilters && (
            <div className="mt-3 text-sm text-slate-600">
              Menampilkan {filteredPrescriptions.length} dari {prescriptions.length} resep
            </div>
          )}
        </div>

        {/* Prescription List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              Loading...
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              {hasActiveFilters ? (
                <>
                  <p>Tidak ada resep yang cocok dengan filter</p>
                  <button 
                    onClick={resetFilters}
                    className="mt-4 px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                  >
                    Reset Filter
                  </button>
                </>
              ) : (
                <>
                  <p>Belum ada resep dibuat</p>
                  <Link href="/prescription/new">
                    <button className="mt-4 px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800">
                      Buat Resep Pertama
                    </button>
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredPrescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-blue-900" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {prescription.patient_name || 'Pasien Anonim'}
                        </h3>
                        {prescription.patient_age && (
                          <p className="text-sm text-slate-600">
                            {prescription.patient_age} tahun
                          </p>
                        )}
                        {prescription.diagnosis && (
                          <p className="text-sm text-slate-600 mt-1">
                            Diagnosis: {prescription.diagnosis}
                          </p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(prescription.status)}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-slate-600 ml-13">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(prescription.issued_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Berlaku sampai: {new Date(prescription.expires_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/prescription/${prescription.id}`}>
                      <button className="px-4 py-2 text-sm bg-blue-50 text-blue-900 rounded-lg hover:bg-blue-100">
                        Lihat Detail
                      </button>
                    </Link>
                    {prescription.status === 'issued' && (
                      <>
                        <Link href={`/prescription/qr/${prescription.id}`}>
                          <button className="px-4 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                            Lihat QR Code
                          </button>
                        </Link>
                        <button
                          onClick={() => cancelPrescription(prescription.id)}
                          disabled={cancellingId === prescription.id}
                          className="flex items-center gap-1 px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Ban className="w-4 h-4" />
                          {cancellingId === prescription.id ? 'Membatalkan...' : 'Batalkan'}
                        </button>
                      </>
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
