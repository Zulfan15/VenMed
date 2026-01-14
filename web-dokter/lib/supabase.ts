import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Role types
export type UserRole = 'admin' | 'doctor' | 'operator'

// Types
export interface Medicine {
  id: string
  name: string
  generic_name: string
  form: string
  strength: string
  manufacturer: string
  stock_quantity: number
  min_stock_level: number
  price_per_unit: number
  description: string
  is_active: boolean
  expired_at: string | null
  created_at: string
  updated_at: string
}

export interface Doctor {
  id: string
  name: string
  license_number: string
  email: string
  phone: string
  role: UserRole
  user_id?: string
  created_at?: string
}

// Medicine status for stock alerts
export interface MedicineStatus extends Medicine {
  status: 'ok' | 'low_stock' | 'expiring_soon' | 'expired'
}

// Admin API Functions

// Get all users (admin only)
export async function getAllUsers(): Promise<Doctor[]> {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return data || []
}

// Update user role (admin only)
export async function updateUserRole(userId: string, role: UserRole): Promise<boolean> {
  const { error } = await supabase
    .from('doctors')
    .update({ role })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user role:', error)
    return false
  }

  return true
}

// Delete user (admin only)
export async function deleteUser(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('doctors')
    .delete()
    .eq('id', userId)

  if (error) {
    console.error('Error deleting user:', error)
    return false
  }

  return true
}

// Get all medicines with status (admin/operator)
export async function getAllMedicines(): Promise<MedicineStatus[]> {
  const { data, error } = await supabase
    .from('medicines')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching medicines:', error)
    return []
  }

  // Calculate status for each medicine
  return (data || []).map(med => {
    let status: 'ok' | 'low_stock' | 'expiring_soon' | 'expired' = 'ok'
    
    if (med.expired_at) {
      const expiredDate = new Date(med.expired_at)
      const today = new Date()
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(today.getDate() + 30)

      if (expiredDate <= today) {
        status = 'expired'
      } else if (expiredDate <= thirtyDaysFromNow) {
        status = 'expiring_soon'
      }
    }
    
    if (status === 'ok' && med.stock_quantity <= med.min_stock_level) {
      status = 'low_stock'
    }

    return { ...med, status }
  })
}

// Get low stock / expiring medicines
export async function getAlertMedicines(): Promise<MedicineStatus[]> {
  const medicines = await getAllMedicines()
  return medicines.filter(m => m.status !== 'ok')
}

// Add new medicine (admin/operator)
export async function addMedicine(medicine: Partial<Medicine>): Promise<Medicine | null> {
  const { data, error } = await supabase
    .from('medicines')
    .insert({
      name: medicine.name,
      generic_name: medicine.generic_name,
      form: 'tablet',
      strength: medicine.strength,
      manufacturer: medicine.manufacturer,
      stock_quantity: medicine.stock_quantity || 0,
      min_stock_level: medicine.min_stock_level || 10,
      price_per_unit: medicine.price_per_unit || 0,
      description: medicine.description,
      is_active: medicine.is_active ?? true,
      expired_at: medicine.expired_at
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding medicine:', error)
    return null
  }

  return data
}

// Update medicine (admin/operator)
export async function updateMedicine(id: string, updates: Partial<Medicine>): Promise<boolean> {
  const { error } = await supabase
    .from('medicines')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating medicine:', error)
    return false
  }

  return true
}

// Update medicine stock
export async function updateMedicineStock(id: string, quantity: number): Promise<boolean> {
  const { error } = await supabase
    .from('medicines')
    .update({ stock_quantity: quantity })
    .eq('id', id)

  if (error) {
    console.error('Error updating stock:', error)
    return false
  }

  return true
}

// Delete medicine (admin only)
export async function deleteMedicine(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('medicines')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('Error deleting medicine:', error)
    return false
  }

  return true
}

// Get dashboard stats for admin
export async function getAdminStats() {
  const [medicines, users, prescriptions] = await Promise.all([
    getAllMedicines(),
    getAllUsers(),
    supabase.from('prescriptions').select('id, status', { count: 'exact' })
  ])

  const alertMedicines = medicines.filter(m => m.status !== 'ok')
  
  return {
    totalMedicines: medicines.length,
    activeMedicines: medicines.filter(m => m.is_active).length,
    lowStockCount: alertMedicines.filter(m => m.status === 'low_stock').length,
    expiringSoonCount: alertMedicines.filter(m => m.status === 'expiring_soon').length,
    expiredCount: alertMedicines.filter(m => m.status === 'expired').length,
    totalUsers: users.length,
    adminCount: users.filter(u => u.role === 'admin').length,
    doctorCount: users.filter(u => u.role === 'doctor').length,
    operatorCount: users.filter(u => u.role === 'operator').length,
    totalPrescriptions: prescriptions.count || 0
  }
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
