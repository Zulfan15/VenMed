'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Loader2, Zap } from 'lucide-react'
import Link from 'next/link'
import { searchMedicines, getMedicinesByNames } from '@/lib/medicines'
import { Medicine, PrescriptionRequest, searchPatients, PatientHistory } from '@/lib/supabase'

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

// Template resep berdasarkan diagnosis umum
interface DiagnosisTemplate {
  id: string
  name: string
  medicines: {
    name: string // nama obat yang akan dicari
    dosage: string
    frequency: string
    duration_days: number
    instructions: string
  }[]
}

const DIAGNOSIS_TEMPLATES: DiagnosisTemplate[] = [
  {
    id: 'demam',
    name: 'Demam',
    medicines: [
      { name: 'Paracetamol', dosage: '1 tablet', frequency: '3', duration_days: 3, instructions: 'Setelah makan' }
    ]
  },
  {
    id: 'flu-ispa',
    name: 'Flu / ISPA',
    medicines: [
      { name: 'Paracetamol', dosage: '1 tablet', frequency: '3', duration_days: 5, instructions: 'Setelah makan' },
      { name: 'CTM', dosage: '1 tablet', frequency: '3', duration_days: 5, instructions: 'Setelah makan' }
    ]
  },
  {
    id: 'sakit-kepala',
    name: 'Sakit Kepala',
    medicines: [
      { name: 'Paracetamol', dosage: '1 tablet', frequency: '3', duration_days: 3, instructions: 'Setelah makan' }
    ]
  },
  {
    id: 'nyeri-radang',
    name: 'Nyeri / Radang',
    medicines: [
      { name: 'Ibuprofen', dosage: '1 tablet', frequency: '3', duration_days: 5, instructions: 'Setelah makan' }
    ]
  },
  {
    id: 'nyeri-haid',
    name: 'Nyeri Haid',
    medicines: [
      { name: 'Mefenamic', dosage: '1 tablet', frequency: '3', duration_days: 3, instructions: 'Setelah makan' }
    ]
  },
  {
    id: 'alergi',
    name: 'Alergi',
    medicines: [
      { name: 'CTM', dosage: '1 tablet', frequency: '3', duration_days: 5, instructions: 'Setelah makan' }
    ]
  },
  {
    id: 'maag',
    name: 'Maag / Asam Lambung',
    medicines: [
      { name: 'Antasida', dosage: '1 tablet', frequency: '3', duration_days: 7, instructions: 'Sebelum makan' }
    ]
  }
]

export default function NewPrescription() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Medicine[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [doctorError, setDoctorError] = useState<string | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)

  // Patient autocomplete state
  const [patientSuggestions, setPatientSuggestions] = useState<PatientHistory[]>([])
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false)

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

  // Search patients for autocomplete
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (patientName.length >= 2) {
        const results = await searchPatients(patientName)
        setPatientSuggestions(results)
        setShowPatientSuggestions(results.length > 0)
      } else {
        setPatientSuggestions([])
        setShowPatientSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [patientName])

  // Fungsi untuk memilih pasien dari suggestions
  const selectPatient = (patient: PatientHistory) => {
    setPatientName(patient.patient_name)
    if (patient.patient_age) setPatientAge(patient.patient_age)
    if (patient.patient_gender) setPatientGender(patient.patient_gender)
    setShowPatientSuggestions(false)
  }

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

  // Fungsi untuk menerapkan template diagnosis
  const applyTemplate = async (template: DiagnosisTemplate) => {
    setLoadingTemplate(true)
    try {
      // Set diagnosis
      setDiagnosis(template.name)
      
      // Cari obat-obatan dari template
      const medicineNames = template.medicines.map(m => m.name)
      const foundMedicines = await getMedicinesByNames(medicineNames)
      
      // Buat item untuk setiap obat yang ditemukan
      const newItems: MedicineItem[] = []
      for (const templateMed of template.medicines) {
        const medicine = foundMedicines.find(m => 
          m.name.toLowerCase().includes(templateMed.name.toLowerCase())
        )
        
        if (medicine) {
          newItems.push({
            id: Math.random().toString(36).substr(2, 9),
            medicine_id: medicine.id,
            medicine_name: medicine.name + ' ' + medicine.strength,
            dosage: templateMed.dosage,
            frequency: templateMed.frequency,
            duration_days: templateMed.duration_days,
            instructions: templateMed.instructions
          })
        }
      }
      
      if (newItems.length > 0) {
        setItems(prev => [...prev, ...newItems])
      } else {
        alert('Obat untuk template ini tidak ditemukan di database')
      }
    } catch (error) {
      console.error('Error applying template:', error)
      alert('Gagal menerapkan template')
    } finally {
      setLoadingTemplate(false)
    }
  }

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
        // Handle stock error with details
        let errorMessage = result.error || 'Failed to create prescription'
        if (result.details && Array.isArray(result.details)) {
          errorMessage += '\n\n' + result.details.join('\n')
        }
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard">
            <button type="button" title="Kembali" aria-label="Kembali" className="p-2 hover:bg-slate-200 rounded-lg text-slate-600">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Resep Baru
            </h1>
            <p className="text-slate-500">
              Buat resep digital untuk pasien
            </p>
          </div>
        </div>

        {/* Doctor Error Alert */}
        {doctorError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800">
              ⚠️ {doctorError}. Pastikan ada data doctor di database.
            </p>
          </div>
        )}

        {/* Doctor Loading */}
        {!doctor && !doctorError && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800">
              🔄 Loading doctor data...
            </p>
          </div>
        )}

        {/* Doctor Info Display */}
        {doctor && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
            <p className="text-emerald-800">
              ✅ Dokter: <strong>{doctor.name}</strong> (SIP: {doctor.license_number})
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Info Card */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">
              Data Pasien
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nama Pasien (opsional)
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  onFocus={() => patientSuggestions.length > 0 && setShowPatientSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowPatientSuggestions(false), 200)}
                  placeholder="Ketik nama atau pilih dari riwayat..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* Patient Suggestions Dropdown */}
                {showPatientSuggestions && patientSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="px-3 py-2 text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                      📋 Pasien dari riwayat
                    </div>
                    {patientSuggestions.map((patient, index) => (
                      <button
                        key={`${patient.patient_name}-${index}`}
                        type="button"
                        onMouseDown={() => selectPatient(patient)}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-slate-100 last:border-b-0"
                      >
                        <div className="font-medium text-slate-800">
                          {patient.patient_name}
                        </div>
                        <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                          {patient.patient_age && <span>🎂 {patient.patient_age} thn</span>}
                          {patient.patient_gender && <span>• {patient.patient_gender === 'Laki-laki' ? '👨' : '👩'} {patient.patient_gender}</span>}
                          <span>• 📊 {patient.visit_count}x kunjungan</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Usia
                  </label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                    placeholder="Tahun"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Jenis Kelamin
                  </label>
                  <select
                    title="Jenis Kelamin"
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Pilih</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Diagnosis
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Contoh: ISPA, Demam, dll."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Template Resep Cepat */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Zap className="w-4 h-4 inline mr-1 text-amber-500" />
                Template Resep Cepat
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Klik template untuk auto-fill diagnosis dan obat
              </p>
              <div className="flex flex-wrap gap-2">
                {DIAGNOSIS_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    disabled={loadingTemplate}
                    className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium 
                             text-blue-800 hover:bg-blue-100 transition-all duration-200 
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingTemplate ? '...' : template.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Catatan Tambahan
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan untuk pasien atau farmasis"
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Medicines Card */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">
              Daftar Obat (Tablet Only)
            </h2>

            {/* Search Medicine */}
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cari & Tambah Obat
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama obat (min. 2 huruf)..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map(medicine => (
                    <button
                      key={medicine.id}
                      type="button"
                      onClick={() => addMedicine(medicine)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-100 border-b border-slate-200 last:border-b-0"
                    >
                      <div className="font-semibold text-slate-800">
                        {medicine.name} - {medicine.strength}
                      </div>
                      <div className="text-sm text-slate-500">
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
                <div className="text-center py-8 text-slate-500">
                  <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada obat ditambahkan</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <div key={item.id} className="border border-slate-300 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-800">
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
                        <label className="block text-xs text-slate-600 mb-1">
                          Dosis per minum
                        </label>
                        <input
                          type="text"
                          value={item.dosage}
                          onChange={(e) => updateItem(item.id, 'dosage', e.target.value)}
                          placeholder="1 tablet"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-600 mb-1">
                          Frekuensi/hari
                        </label>
                        <input
                          type="number"
                          value={item.frequency}
                          onChange={(e) => updateItem(item.id, 'frequency', e.target.value)}
                          placeholder="3"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-600 mb-1">
                          Durasi (hari)
                        </label>
                        <input
                          type="number"
                          value={item.duration_days}
                          onChange={(e) => updateItem(item.id, 'duration_days', parseInt(e.target.value))}
                          placeholder="7"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs text-slate-600 mb-1">
                        Instruksi
                      </label>
                      <select
                        title="Instruksi"
                        value={item.instructions}
                        onChange={(e) => updateItem(item.id, 'instructions', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Setelah makan">Setelah makan</option>
                        <option value="Sebelum makan">Sebelum makan</option>
                        <option value="Sebelum tidur">Sebelum tidur</option>
                        <option value="Sesudah makan">Sesudah makan</option>
                      </select>
                    </div>

                    <div className="mt-2 text-xs text-slate-600">
                      Total: {item.frequency} × {item.duration_days} = {parseInt(item.frequency) * item.duration_days} tablet
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Link href="/dashboard" className="flex-1">
              <button
                type="button"
                className="w-full px-6 py-3 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading || items.length === 0 || !doctor}
              className="flex-1 px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
