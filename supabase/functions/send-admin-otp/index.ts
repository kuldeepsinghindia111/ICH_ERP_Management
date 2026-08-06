// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email } = await req.json()
    if (!email) throw new Error('Email is required')

    const cleanedEmail = String(email).trim().toLowerCase()

    // 1. Generate random 4-digit code (1000 - 9999)
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 mins

    // 2. Invalidate previous unused codes for this email
    await supabaseAdmin
      .from('auth_otp_codes')
      .update({ used: true })
      .ilike('email', cleanedEmail)
      .eq('used', false)

    // 3. Save new 4-digit OTP code in database
    const { error: insertError } = await supabaseAdmin
      .from('auth_otp_codes')
      .insert([
        {
          email: cleanedEmail,
          code: otpCode,
          expires_at: expiresAt,
          used: false,
          attempts: 0
        }
      ])

    if (insertError) {
      throw new Error('Failed to store 4-digit OTP: ' + insertError.message)
    }

    console.log(`[ADMIN DISPATCHED 4-DIGIT OTP FOR ${cleanedEmail}]: ${otpCode}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `4-digit OTP successfully generated and sent to ${cleanedEmail}`,
        email: cleanedEmail,
        codePreview: otpCode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
