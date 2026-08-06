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

    const { email, code } = await req.json()
    if (!email || !code) {
      throw new Error('Email and 4-digit verification code are required')
    }

    const cleanedEmail = String(email).trim().toLowerCase()
    const cleanedCode = String(code).trim()

    if (cleanedCode.length !== 4) {
      throw new Error('Verification code must be exactly 4 digits.')
    }

    // 1. Fetch latest active OTP record
    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from('auth_otp_codes')
      .select('*')
      .eq('email', cleanedEmail)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchError || !otpRecord) {
      throw new Error('No active verification code found for this email. Please request a new code.')
    }

    // 2. Check expiration
    if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
      await supabaseAdmin.from('auth_otp_codes').update({ used: true }).eq('id', otpRecord.id)
      throw new Error('Verification code has expired. Please request a new code.')
    }

    // 3. Check attempts count
    if (otpRecord.attempts >= 5) {
      await supabaseAdmin.from('auth_otp_codes').update({ used: true }).eq('id', otpRecord.id)
      throw new Error('Maximum verification attempts exceeded. Please request a new code.')
    }

    // 4. Verify code match
    if (otpRecord.code !== cleanedCode) {
      // Increment attempt counter
      await supabaseAdmin
        .from('auth_otp_codes')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id)
      
      const remaining = 4 - otpRecord.attempts
      throw new Error(`Invalid 4-digit code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Please request a new code.'}`)
    }

    // 5. Code matched! Mark as used
    await supabaseAdmin
      .from('auth_otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id)

    return new Response(
      JSON.stringify({ 
        verified: true, 
        message: '4-digit code verified successfully!' 
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
