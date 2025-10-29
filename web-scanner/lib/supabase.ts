import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface VerifyQRRequest {
  token: string
  action: 'verify' | 'dispense'
}

export interface MedicineItem {
  medicine: {
    name: string
    generic_name: string
    strength: string
    form: string
  }
  dosage: string
  frequency: string
  duration_days: number
  total_quantity: number
  instructions: string
}

export interface PrescriptionVerification {
  valid: boolean
  success?: boolean
  action?: string
  token?: string
  prescription: {
    id: string
    patient_name: string
    patient_age?: number
    diagnosis?: string
    doctor: {
      name: string
      license_number: string
    }
    issued_at: string
    status: string
  }
  items: MedicineItem[]
  token_info?: {
    expires_at: string
    used_at: string | null
  }
  error?: string
}
