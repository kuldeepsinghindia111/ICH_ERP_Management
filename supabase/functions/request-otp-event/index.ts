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

    // Update status in user_roles to 'otp_requested'
    const { error: updateError } = await supabaseAdmin
      .from('user_roles')
      .update({ status: 'otp_requested' })
      .ilike('email', cleanedEmail)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP request received. Admin has been notified for verification.' 
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
