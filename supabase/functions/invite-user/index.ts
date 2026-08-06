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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header found');
    
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token)

    if (userError) throw userError;
    if (!user) throw new Error('Not logged in')

    // Check if the user is an admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || !roleData || roleData.role !== 'admin') {
      throw new Error('Unauthorized. Only admins can invite users.')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, role, name, redirectTo } = await req.json()

    if (!email || !role || !name) {
      throw new Error('Email, role, and name are required')
    }

    const cleanedEmail = String(email).trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanedEmail)) {
      throw new Error("Invalid email format. Please provide a valid email address (e.g. user@college.edu)")
    }

    const requestOtpRedirectUrl = `${redirectTo ? new URL(redirectTo).origin : 'https://ichacc.online'}/request-otp?email=${encodeURIComponent(cleanedEmail)}`

    // Generate link / invite user with custom redirect to /request-otp
    let inviteUserRes = await supabaseAdmin.auth.admin.inviteUserByEmail(cleanedEmail, {
      data: { name: name, full_name: name },
      redirectTo: requestOtpRedirectUrl
    })

    if (inviteUserRes.error && inviteUserRes.error.message.includes('already exists')) {
      // Fallback: generate link if user exists
      const genRes = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: cleanedEmail,
        options: {
          data: { name: name, full_name: name },
          redirectTo: requestOtpRedirectUrl
        }
      })
      if (!genRes.error) {
        inviteUserRes = { data: { user: genRes.data.user }, error: null }
      }
    }

    if (inviteUserRes.error) throw inviteUserRes.error

    const invitedUserId = inviteUserRes.data?.user?.id
    if (!invitedUserId) throw new Error('Failed to retrieve invited user ID')

    // Upsert role into user_roles with initial status 'pending'
    const { error: insertRoleError } = await supabaseAdmin
      .from('user_roles')
      .upsert([
        { id: invitedUserId, email: cleanedEmail, role: role, name: name, status: 'pending' }
      ], { onConflict: 'id' })
      
    if (insertRoleError) throw insertRoleError

    return new Response(
      JSON.stringify({ 
        message: `Successfully sent OTP request invite to ${email}`, 
        user: inviteUserRes.data.user,
        requestOtpUrl: requestOtpRedirectUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    let errorMsg = error?.message || String(error);
    if (errorMsg.includes("Unable to validate email address") || errorMsg.includes("invalid format")) {
      errorMsg = "Invalid email format. Please provide a valid email address (e.g. user@college.edu)";
    } else if (errorMsg.includes("User already registered") || errorMsg.includes("already exists")) {
      errorMsg = "A user with this email address is already registered.";
    }
    
    return new Response(JSON.stringify({ error: errorMsg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
