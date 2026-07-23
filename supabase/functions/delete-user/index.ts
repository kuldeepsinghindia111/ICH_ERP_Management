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
      throw new Error('Unauthorized. Only admins can delete users.')
    }

    // Use Service Role to delete from auth metadata
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId } = await req.json()

    if (!userId) {
      throw new Error('UserId is required')
    }

    // Delete the user from the Supabase Dashboard internal auth system
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) throw deleteError

    // Also delete from user_roles just in case there's no cascade delete set up
    const { error: rolesDeleteError } = await supabaseAdmin.from('user_roles').delete().eq('id', userId)
    if (rolesDeleteError) throw rolesDeleteError

    return new Response(
      JSON.stringify({ message: `Successfully deleted user` }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    // We MUST return 200 here for supabase-js to parse the JSON error body correctly.
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
