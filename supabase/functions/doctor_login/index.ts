// Supabase Edge Function: doctor_login
// Purpose: Handle doctor authentication and return doctor profile
// Endpoint: POST /doctor_login

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LoginRequest {
  email: string
  password: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
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
    const requestData: LoginRequest = await req.json()

    // Validate required fields
    if (!requestData.email || !requestData.password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Try to sign in with Supabase Auth
    const { data: authData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: requestData.email,
      password: requestData.password,
    })

    if (signInError || !authData.user) {
      return new Response(
        JSON.stringify({ error: 'Email atau password salah' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get doctor profile
    const { data: doctor, error: doctorError } = await supabaseClient
      .from('doctors')
      .select('id, name, license_number, email, phone, specialization')
      .eq('email', requestData.email)
      .single()

    if (doctorError || !doctor) {
      return new Response(
        JSON.stringify({ 
          error: 'Akun dokter tidak ditemukan. Silakan hubungi administrator.',
          user_id: authData.user.id 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update doctor with user_id if not set
    if (!doctor.user_id) {
      await supabaseClient
        .from('doctors')
        .update({ user_id: authData.user.id })
        .eq('id', doctor.id)
    }

    // Return success with doctor data
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email
        },
        doctor: doctor,
        session: {
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token
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
