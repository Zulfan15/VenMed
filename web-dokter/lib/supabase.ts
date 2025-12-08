import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Medicine {
  id: string
  name: string
  generic_name: string
  form: string
  strength: string
  manufacturer: string
  stock_quantity: number
  price_per_unit: number
  description: string
  is_active: boolean
}

export interface Doctor {
  id: string
  name: string
  license_number: string
  email: string
  phone: string
}

export interface PrescriptionItem {
  medicine_id: string
  dosage: string
  frequency: string
  duration_days: number
  instructions?: string
}

export interface PrescriptionRequest {
  doctor_id: string
  patient_name?: string
  patient_age?: number
  patient_gender?: string
  diagnosis?: string
  notes?: string
  items: PrescriptionItem[]
}

export interface PrescriptionResponse {
  success: boolean
  prescription: {
    id: string
    status: string
    issued_at: string
    expires_at: string
  }
  qr_token: {
    token: string
    id: string
  }
  items: PrescriptionItem[]
}

// Interface untuk riwayat pasien
export interface PatientHistory {
  patient_name: string
  patient_age: number | null
  patient_gender: string | null
  diagnosis: string | null
  last_visit: string
  visit_count: number
}

// Fungsi untuk mencari pasien berdasarkan nama (autocomplete)
export async function searchPatients(query: string): Promise<PatientHistory[]> {
  if (!query || query.length < 2) return []
  
  const { data, error } = await supabase
    .from('prescriptions')
    .select('patient_name, patient_age, patient_gender, diagnosis, issued_at')
    .ilike('patient_name', `%${query}%`)
    .order('issued_at', { ascending: false })
    .limit(50)

  if (error || !data) return []

  // Group by patient name and get latest data
  const patientMap = new Map<string, PatientHistory>()
  
  for (const row of data) {
    if (!row.patient_name || row.patient_name === 'Anonim') continue
    
    const existing = patientMap.get(row.patient_name)
    if (existing) {
      existing.visit_count++
    } else {
      patientMap.set(row.patient_name, {
        patient_name: row.patient_name,
        patient_age: row.patient_age,
        patient_gender: row.patient_gender,
        diagnosis: row.diagnosis,
        last_visit: row.issued_at,
        visit_count: 1
      })
    }
  }

  return Array.from(patientMap.values()).slice(0, 10)
}

// Fungsi untuk mendapatkan riwayat resep pasien
export async function getPatientPrescriptions(patientName: string) {
  const { data, error } = await supabase
    .from('prescriptions')
    .select(`
      id,
      patient_name,
      patient_age,
      patient_gender,
      diagnosis,
      notes,
      issued_at,
      status,
      prescription_items (
        dosage,
        frequency,
        duration_days,
        instructions,
        medicines (
          name,
          strength
        )
      )
    `)
    .eq('patient_name', patientName)
    .order('issued_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching patient prescriptions:', error)
    return []
  }

  return data || []
}
