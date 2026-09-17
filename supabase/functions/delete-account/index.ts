import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authorization = request.headers.get('Authorization')
  if (!authorization) return new Response(JSON.stringify({ error: '未登录' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authorization } } },
  )
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return new Response(JSON.stringify({ error: '登录状态无效' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
  const { error } = await adminClient.auth.admin.deleteUser(userData.user.id)
  if (error) return new Response(JSON.stringify({ error: '账号删除失败' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
