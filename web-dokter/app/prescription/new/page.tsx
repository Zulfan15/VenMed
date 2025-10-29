'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { searchMedicines } from '@/lib/medicines'
import { Medicine, PrescriptionRequest } from '@/lib/supabase'

interface Doctor {
  id: string
  name: string
  license_number: string
  email: string
}

interface MedicineItem {
  id: string
  medicine_id: string
  medicine_name: string
  dosage: string
  frequency: string
  duration_days: number
  instructions: string
}

export default function NewPrescription() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Medicine[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [doctorError, setDoctorError] = useState<string | null>(null)

  // Form state
  const [patientName, setPatientName] = useState('')
  const [patientAge, setPatientAge] = useState<number | ''>('')
  const [patientGender, setPatientGender] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<MedicineItem[]>([])

  // Check if doctor is logged in
  useEffect(() => {
    const storedDoctor = localStorage.getItem('doctor')
    if (!storedDoctor) {
      router.push('/login')
      return
    }

    try {
      const doctorData = JSON.parse(storedDoctor)
      setDoctor(doctorData)
    } catch (err) {
      console.error('Error parsing doctor data:', err)
      setDoctorError('Failed to load doctor info')
      router.push('/login')
    }
  }, [router])

  // Search medicines
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        const results = await searchMedicines(searchQuery)
        setSearchResults(results)
        setShowSearchResults(true)
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const addMedicine = (medicine: Medicine) => {
    const newItem: MedicineItem = {
      id: Math.random().toString(36).substr(2, 9),
      medicine_id: medicine.id,
      medicine_name: medicine.name + ' ' + medicine.strength,
      dosage: '1 tablet',
      frequency: '3',
      duration_days: 7,
      instructions: 'Setelah makan'
    }
    setItems([...items, newItem])
    setSearchQuery('')
    setShowSearchResults(false)
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof MedicineItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!doctor) {
      alert('Doctor tidak ditemukan. Silakan login kembali.')
      router.push('/login')
      return
    }

    if (items.length === 0) {
      alert('Tambahkan minimal 1 obat')
      return
    }

    setLoading(true)

    try {
      // Prepare prescription data
      const prescriptionData: PrescriptionRequest = {
        doctor_id: doctor.id,
        patient_name: patientName || 'Anonymous',
        patient_age: patientAge === '' ? undefined : Number(patientAge),
        patient_gender: patientGender || undefined,
        diagnosis: diagnosis || undefined,
        notes: notes || undefined,
        items: items.map(item => ({
          medicine_id: item.medicine_id,
          dosage: item.dosage,
          frequency: `${item.frequency} kali sehari`,
          duration_days: item.duration_days,
          instructions: item.instructions
        }))
      }

      // Call edge function (replace with actual Supabase URL)
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create_prescription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(prescriptionData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Redirect to QR page
        router.push(`/prescription/qr/${result.qr_token.token}`)
      } else {
        alert('Error: ' + (result.error || 'Failed to create prescription'))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/">
            <button type="button" title="Kembali" aria-label="Kembali" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Resep Baru
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Buat resep digital untuk pasien
            </p>
          </div>
        </div>

        {/* Doctor Error Alert */}
        {doctorError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-red-800 dark:text-red-200">
              ⚠️ {doctorError}. Pastikan ada data doctor di database.
            </p>
          </div>
        )}

        {/* Doctor Loading */}
        {!doctor && !doctorError && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-blue-800 dark:text-blue-200">
              🔄 Loading doctor data...
            </p>
          </div>
        )}

        {/* Doctor Info Display */}
        {doctor && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
            <p className="text-green-800 dark:text-green-200">
              ✅ Dokter: <strong>{doctor.name}</strong> (SIP: {doctor.license_number})
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Data Pasien
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nama Pasien (opsional)
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Anonim jika dikosongkan"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Usia
                  </label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                    placeholder="Tahun"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Jenis Kelamin
                  </label>
                  <select
                    title="Jenis Kelamin"
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Pilih</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Diagnosis
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Contoh: ISPA, Demam, dll."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Catatan Tambahan
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan untuk pasien atau farmasis"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Medicines Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Daftar Obat (Tablet Only)
            </h2>

            {/* Search Medicine */}
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cari & Tambah Obat
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama obat (min. 2 huruf)..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map(medicine => (
                    <button
                      key={medicine.id}
                      type="button"
                      onClick={() => addMedicine(medicine)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {medicine.name} - {medicine.strength}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {medicine.generic_name} • Stok: {medicine.stock_quantity}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Medicine Items */}
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada obat ditambahkan</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <div key={item.id} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {index + 1}. {item.medicine_name}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                        title={`Hapus ${item.medicine_name}`}
                        aria-label={`Hapus ${item.medicine_name}`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Dosis per minum
                        </label>
                        <input
                          type="text"
                          value={item.dosage}
                          onChange={(e) => updateItem(item.id, 'dosage', e.target.value)}
                          placeholder="1 tablet"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Frekuensi/hari
                        </label>
                        <input
                          type="number"
                          value={item.frequency}
                          onChange={(e) => updateItem(item.id, 'frequency', e.target.value)}
                          placeholder="3"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Durasi (hari)
                        </label>
                        <input
                          type="number"
                          value={item.duration_days}
                          onChange={(e) => updateItem(item.id, 'duration_days', parseInt(e.target.value))}
                          placeholder="7"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Instruksi
                      </label>
                      <select
                        title="Instruksi"
                        value={item.instructions}
                        onChange={(e) => updateItem(item.id, 'instructions', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="Setelah makan">Setelah makan</option>
                        <option value="Sebelum makan">Sebelum makan</option>
                        <option value="Sebelum tidur">Sebelum tidur</option>
                        <option value="Sesudah makan">Sesudah makan</option>
                      </select>
                    </div>

                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Total: {item.frequency} × {item.duration_days} = {parseInt(item.frequency) * item.duration_days} tablet
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Link href="/" className="flex-1">
              <button
                type="button"
                className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Batal
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading || items.length === 0 || !doctor}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Membuat Resep...
                </>
              ) : (
                'Generate QR Code'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
