// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the session or user object
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header found');
    
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token)

    if (userError) throw userError;
    if (!user) throw new Error('Not logged in')

    // Check if the user is an admin by querying the user_roles table
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || !roleData || roleData.role !== 'admin') {
      throw new Error('Unauthorized. Only admins can invite users.')
    }

    // Now that we confirmed they are an admin, we use the SERVICE_ROLE_KEY to invite the new user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, role, name } = await req.json()

    if (!email || !role || !name) {
      throw new Error('Email, role, and name are required')
    }

    // Invite the user
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)

    if (inviteError) throw inviteError

    // Insert or update their role in the user_roles table
    const { error: insertRoleError } = await supabaseAdmin
      .from('user_roles')
      .upsert([
        { id: inviteData.user.id, email: inviteData.user.email, role: role, name: name, status: 'pending' }
      ], { onConflict: 'id' })
      
    if (insertRoleError) throw insertRoleError

    return new Response(
      JSON.stringify({ message: `Successfully sent invite to ${email}`, user: inviteData.user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    // Return 200 so the supabase-js client parses the JSON body instead of throwing a generic "non-2xx" error.
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
