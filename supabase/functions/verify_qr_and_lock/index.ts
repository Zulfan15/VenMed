// Supabase Edge Function: verify_qr_and_lock
// Purpose: Verify QR token and mark as used (one-time use)
// Endpoint: POST /verify_qr_and_lock

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyQRRequest {
  token: string;
  action?: 'verify' | 'dispense'; // 'verify' only checks, 'dispense' marks as used
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
    const requestData: VerifyQRRequest = await req.json()

    // Validate required fields
    if (!requestData.token) {
      return new Response(
        JSON.stringify({ error: 'token is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const action = requestData.action || 'verify'

    // Get QR token with prescription details
    const { data: qrToken, error: qrError } = await supabaseClient
      .from('qr_tokens')
      .select(`
        id,
        token,
        is_valid,
        used_at,
        expires_at,
        prescription_id,
        prescriptions (
          id,
          patient_name,
          patient_age,
          diagnosis,
          status,
          issued_at,
          expires_at,
          doctors (
            name,
            license_number
          )
        )
      `)
      .eq('token', requestData.token)
      .single()

    if (qrError || !qrToken) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'QR token not found'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if token is valid
    if (!qrToken.is_valid) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'QR token has already been used',
          used_at: qrToken.used_at
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if token has expired
    const now = new Date()
    const expiresAt = new Date(qrToken.expires_at)
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'QR token has expired',
          expires_at: qrToken.expires_at
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check prescription status
    const prescription = qrToken.prescriptions as any
    if (prescription.status !== 'issued') {
      return new Response(
        JSON.stringify({
          valid: false,
          error: `Prescription status is ${prescription.status}, cannot be dispensed`
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get prescription items with medicine details
    const { data: prescriptionItems, error: itemsError } = await supabaseClient
      .from('prescription_items')
      .select(`
        id,
        dosage,
        frequency,
        duration_days,
        total_quantity,
        instructions,
        medicines (
          id,
          name,
          generic_name,
          strength,
          form,
          stock_quantity,
          expired_at
        )
      `)
      .eq('prescription_id', prescription.id)

    if (itemsError || !prescriptionItems) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Failed to fetch prescription items'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if all medicines have sufficient stock
    const insufficientStock = prescriptionItems.filter(item => {
      const medicine = item.medicines as any
      return medicine.stock_quantity < item.total_quantity
    })

    if (insufficientStock.length > 0) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Insufficient stock for one or more medicines',
          insufficient_items: insufficientStock.map(item => ({
            medicine: (item.medicines as any).name,
            required: item.total_quantity,
            available: (item.medicines as any).stock_quantity
          }))
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if any medicines are expired
    const expiredMedicines = prescriptionItems.filter(item => {
      const medicine = item.medicines as any
      if (!medicine.expired_at) return false
      const expiredDate = new Date(medicine.expired_at)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return expiredDate <= today
    })

    if (expiredMedicines.length > 0) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Cannot dispense: One or more medicines have expired',
          expired_items: expiredMedicines.map(item => ({
            medicine: (item.medicines as any).name,
            expired_at: (item.medicines as any).expired_at
          }))
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // If action is 'dispense', mark token as used and update prescription
    if (action === 'dispense') {
      // Mark QR token as used
      const { error: updateQRError } = await supabaseClient
        .from('qr_tokens')
        .update({
          is_valid: false,
          used_at: new Date().toISOString()
        })
        .eq('id', qrToken.id)

      if (updateQRError) {
        console.error('Failed to update QR token:', updateQRError)
        return new Response(
          JSON.stringify({ error: 'Failed to mark token as used' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Update prescription status
      const { error: updatePrescriptionError } = await supabaseClient
        .from('prescriptions')
        .update({
          status: 'dispensed',
          dispensed_at: new Date().toISOString()
        })
        .eq('id', prescription.id)

      if (updatePrescriptionError) {
        console.error('Failed to update prescription:', updatePrescriptionError)
      }

      // Reduce medicine stock
      for (const item of prescriptionItems) {
        const medicine = item.medicines as any
        await supabaseClient
          .from('medicines')
          .update({
            stock_quantity: medicine.stock_quantity - item.total_quantity
          })
          .eq('id', medicine.id)
      }

      // Create vending transaction record
      await supabaseClient
        .from('vending_transactions')
        .insert({
          prescription_id: prescription.id,
          qr_token_id: qrToken.id,
          status: 'completed',
          dispensed_at: new Date().toISOString()
        })
    }

    // Return success response with prescription details
    return new Response(
      JSON.stringify({
        valid: true,
        action: action,
        prescription: {
          id: prescription.id,
          patient_name: prescription.patient_name,
          patient_age: prescription.patient_age,
          diagnosis: prescription.diagnosis,
          doctor: prescription.doctors,
          issued_at: prescription.issued_at,
          status: action === 'dispense' ? 'dispensed' : prescription.status
        },
        items: prescriptionItems.map(item => ({
          medicine: {
            name: (item.medicines as any).name,
            generic_name: (item.medicines as any).generic_name,
            strength: (item.medicines as any).strength,
            form: (item.medicines as any).form
          },
          dosage: item.dosage,
          frequency: item.frequency,
          duration_days: item.duration_days,
          total_quantity: item.total_quantity,
          instructions: item.instructions
        })),
        token_info: {
          expires_at: qrToken.expires_at,
          used_at: action === 'dispense' ? new Date().toISOString() : null
        }
      }),
      {
        status: 200,
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
