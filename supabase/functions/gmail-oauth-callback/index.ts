import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey'
};
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code || !state) {
      return new Response(JSON.stringify({
        error: 'Missing code or state parameter'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const stateData = JSON.parse(atob(state));
    const { userId, redirectUrl } = stateData;
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: `${supabaseUrl}/functions/v1/gmail-oauth-callback`,
        grant_type: 'authorization_code'
      })
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${JSON.stringify(tokens)}`);
    }
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });
    const userInfo = await userInfoResponse.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);
    const { data: tokenData, error: dbError } = await supabase.from('gmail_tokens').upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: expiryDate.toISOString(),
      email: userInfo.email,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    }).select().single();
    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }
    const { error: configError } = await supabase.from('email_configurations').upsert({
      user_id: userId,
      name: `Gmail - ${userInfo.email}`,
      email: userInfo.email,
      provider: 'gmail',
      is_connected: true,
      gmail_token_id: tokenData.id,
      last_sync_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });
    if (configError) {
      console.error('Error creating email configuration:', configError);
    }
    return new Response(`
    <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; background:#f6fff8; margin:0; display:flex; align-items:center; justify-content:center; height:100vh; }
            .card { background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:28px 32px; text-align:center; box-shadow:0 10px 20px rgba(0,0,0,0.06); }
            .icon { width:56px; height:56px; border-radius:9999px; background:#ecfdf5; color:#059669; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; font-size:30px; }
            .title { font-weight:700; color:#065f46; margin-bottom:4px; }
            .subtitle { color:#475569; font-size:14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <div class="title">Connexion Gmail réussie</div>
            <div class="subtitle">Vous pouvez fermer cette fenêtre.</div>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'gmail-connected', email: '${userInfo.email}' }, '*');
              setTimeout(() => window.close(), 500);
            } else {
              window.location.href = '${redirectUrl || supabaseUrl}';
            }
          </script>
        </body>
    </html>`, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html'
      }
    });
  } catch (error) {
    console.error('Error in Gmail OAuth callback:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});