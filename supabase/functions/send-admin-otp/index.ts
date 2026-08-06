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

    // 4. Dispatch Email to User
    // Attempt sending via Supabase Auth magiclink / OTP email trigger
    try {
      await supabaseAdmin.auth.signInWithOtp({
        email: cleanedEmail,
        options: {
          data: { otp_code: otpCode }
        }
      })
    } catch (emailErr) {
      console.warn("Supabase Auth mailer trigger notice:", emailErr)
    }

    // If RESEND_API_KEY environment variable is configured, send pretty HTML email
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: 'Imperial College Portal <auth@ichacc.online>',
            to: [cleanedEmail],
            subject: `Your 4-Digit Verification Code: ${otpCode}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #1e293b; margin-top: 0;">Verification Code Required</h2>
                <p style="color: #475569; font-size: 14px;">Your System Administrator has generated your 4-digit verification code for portal access:</p>
                <div style="text-align: center; margin: 24px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; background: #eff6ff; padding: 12px 24px; border-radius: 8px; border: 1px border #bfdbfe;">${otpCode}</span>
                </div>
                <p style="color: #64748b; font-size: 13px;">Please communicate this 4-digit code to your Administrator to complete your account activation.</p>
              </div>
            `
          })
        })
      } catch (rErr) {
        console.warn("Resend API dispatch error:", rErr)
      }
    }

    console.log(`[ADMIN DISPATCHED 4-DIGIT OTP FOR ${cleanedEmail}]: ${otpCode}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `4-digit OTP successfully sent to ${cleanedEmail}`,
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
