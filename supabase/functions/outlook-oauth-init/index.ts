import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey'
};
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
  try {
    const authHeader = req.headers.get('Authorization');
    // Body: redirectUrl (window.location.origin), userId, accessToken (fallback)
    let redirectUrl = '/', passedUserId = null, bodyAccessToken = null;
    try {
      const body = await req.json();
      redirectUrl = body?.redirectUrl || '/';
      if (body?.userId) passedUserId = String(body.userId);
      if (body?.accessToken) bodyAccessToken = String(body.accessToken);
    } catch  {}
    const token = (authHeader ? authHeader.replace('Bearer ', '') : null) || bodyAccessToken;
    if (!token) return new Response(JSON.stringify({
      code: 401,
      message: 'Missing authorization token'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    let userId = passedUserId;
    if (!userId) {
      const userRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: Deno.env.get('SUPABASE_ANON_KEY')
        }
      });
      const uj = await userRes.json().catch(()=>({}));
      const u = uj?.user ?? uj?.data?.user ?? (uj?.id ? uj : null);
      if (!userRes.ok || !u?.id) return new Response(JSON.stringify({
        code: 401,
        message: 'Invalid token'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
      userId = u.id;
    }
    const microsoftClientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    if (!microsoftClientId) throw new Error('Microsoft Client ID not configured');
    // Etat et scopes minimaux
    const state = btoa(JSON.stringify({
      userId,
      redirectUrl
    }));
    const scopes = [
      'openid',
      'profile',
      'email',
      'offline_access',
      'https://graph.microsoft.com/User.Read'
    ];
    // Redirect court vers la page frontend
    const tenantSegment = 'common';
    const frontendCallback = `${redirectUrl.replace(/\/$/, '')}/outlook-oauth-callback.html`;
    const authUrl = new URL(`https://login.microsoftonline.com/${tenantSegment}/oauth2/v2.0/authorize`);
    authUrl.searchParams.set('client_id', microsoftClientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', frontendCallback);
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_mode', 'query');
    authUrl.searchParams.set('prompt', 'login');
    return new Response(JSON.stringify({
      authUrl: authUrl.toString()
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in Outlook OAuth init:', error);
    return new Response(JSON.stringify({
      error: error?.message ?? 'Unknown error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
