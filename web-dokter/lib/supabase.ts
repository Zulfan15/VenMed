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
