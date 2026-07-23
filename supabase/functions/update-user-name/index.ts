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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verify the caller is logged in
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header found');
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError) throw userError;
    if (!user) throw new Error('Not logged in')

    // Verify the caller is an admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || !roleData || roleData.role !== 'admin') {
      throw new Error('Unauthorized. Only admins can update user metadata.')
    }

    // Use Service Role to update auth metadata
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, name } = await req.json()

    if (!userId || !name) {
      throw new Error('UserId and name are required')
    }

    // Update the display name in the Supabase Dashboard internal auth system
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { name: name, full_name: name } }
    )

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ message: `Successfully updated name for user`, user: updateData.user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
