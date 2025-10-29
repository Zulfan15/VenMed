// Supabase Edge Function: create_prescription
// Purpose: Create prescription and generate QR token
// Endpoint: POST /create_prescription

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PrescriptionItem {
  medicine_id: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions?: string;
}

interface PrescriptionRequest {
  doctor_id: string;
  patient_name?: string;
  patient_age?: number;
  patient_gender?: string;
  diagnosis?: string;
  notes?: string;
  items: PrescriptionItem[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse request body
    const prescriptionData: PrescriptionRequest = await req.json()

    // Validate required fields
    if (!prescriptionData.doctor_id || !prescriptionData.items || prescriptionData.items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'doctor_id and items are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify doctor exists
    const { data: doctor, error: doctorError } = await supabaseClient
      .from('doctors')
      .select('id')
      .eq('id', prescriptionData.doctor_id)
      .single()

    if (doctorError || !doctor) {
      return new Response(
        JSON.stringify({ error: 'Doctor not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify all medicines exist and are tablets
    const medicineIds = prescriptionData.items.map(item => item.medicine_id)
    const { data: medicines, error: medicinesError } = await supabaseClient
      .from('medicines')
      .select('id, name, form, stock_quantity')
      .in('id', medicineIds)
      .eq('form', 'tablet')
      .eq('is_active', true)

    if (medicinesError || !medicines || medicines.length !== medicineIds.length) {
      return new Response(
        JSON.stringify({ error: 'One or more medicines not found or not in tablet form' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create prescription
    const { data: prescription, error: prescriptionError } = await supabaseClient
      .from('prescriptions')
      .insert({
        doctor_id: prescriptionData.doctor_id,
        patient_name: prescriptionData.patient_name || 'Anonymous',
        patient_age: prescriptionData.patient_age,
        patient_gender: prescriptionData.patient_gender,
        diagnosis: prescriptionData.diagnosis,
        notes: prescriptionData.notes,
        status: 'issued',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      })
      .select()
      .single()

    if (prescriptionError || !prescription) {
      console.error('Prescription creation error:', prescriptionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create prescription', details: prescriptionError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Insert prescription items
    const prescriptionItems = prescriptionData.items.map(item => ({
      prescription_id: prescription.id,
      medicine_id: item.medicine_id,
      dosage: item.dosage,
      frequency: item.frequency,
      duration_days: item.duration_days,
      instructions: item.instructions || ''
    }))

    const { data: items, error: itemsError } = await supabaseClient
      .from('prescription_items')
      .insert(prescriptionItems)
      .select()

    if (itemsError) {
      console.error('Prescription items creation error:', itemsError)
      // Rollback prescription
      await supabaseClient
        .from('prescriptions')
        .delete()
        .eq('id', prescription.id)
      
      return new Response(
        JSON.stringify({ error: 'Failed to create prescription items', details: itemsError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate QR token
    const token = `RX-${prescription.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const { data: qrToken, error: qrError } = await supabaseClient
      .from('qr_tokens')
      .insert({
        prescription_id: prescription.id,
        token: token,
        is_valid: true,
        expires_at: prescription.expires_at
      })
      .select()
      .single()

    if (qrError) {
      console.error('QR token creation error:', qrError)
      return new Response(
        JSON.stringify({ error: 'Failed to create QR token', details: qrError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        prescription: {
          id: prescription.id,
          status: prescription.status,
          issued_at: prescription.issued_at,
          expires_at: prescription.expires_at
        },
        qr_token: {
          token: qrToken.token,
          id: qrToken.id
        },
        items: items
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
