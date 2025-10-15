import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

type GmailTokenRow = {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_expiry: string; // ISO
  email: string;
};

function isExpiringSoon(isoExpiry: string, thresholdSeconds: number = 300): boolean {
  const now = Date.now();
  const expiry = new Date(isoExpiry).getTime();
  return expiry - now <= thresholdSeconds * 1000;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(jwt.split('.')[1] || 'e30='));
    const userId: string | undefined = payload?.sub;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid JWT' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: row, error: fetchErr } = await supabase
      .from('gmail_tokens')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle<GmailTokenRow>();

    if (fetchErr) {
      throw new Error(`DB fetch error: ${fetchErr.message}`);
    }
    if (!row) {
      return new Response(JSON.stringify({ error: 'No Gmail token found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let accessToken = row.access_token;
    let tokenExpiryIso = row.token_expiry;

    if (isExpiringSoon(row.token_expiry)) {
      const refreshResp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: googleClientId,
          client_secret: googleClientSecret,
          grant_type: 'refresh_token',
          refresh_token: row.refresh_token,
        }),
      });

      const refreshed = await refreshResp.json();
      if (!refreshResp.ok) {
        console.error('Refresh failed:', refreshed);
        return new Response(JSON.stringify({ error: 'Failed to refresh access token' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const newExpiry = new Date();
      newExpiry.setSeconds(newExpiry.getSeconds() + (refreshed.expires_in || 3600));

      const updatePayload: Partial<GmailTokenRow> & { updated_at?: string } = {
        access_token: refreshed.access_token,
        token_expiry: newExpiry.toISOString(),
        // Some providers do not return refresh_token on refresh; preserve existing one
      } as any;

      const { data: updated, error: updErr } = await supabase
        .from('gmail_tokens')
        .update({
          access_token: updatePayload.access_token,
          token_expiry: updatePayload.token_expiry,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
        .select('*')
        .single<GmailTokenRow>();

      if (updErr) {
        throw new Error(`DB update error: ${updErr.message}`);
      }

      accessToken = updated.access_token;
      tokenExpiryIso = updated.token_expiry;
    }

    return new Response(
      JSON.stringify({ access_token: accessToken, token_expiry: tokenExpiryIso, email: row.email }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('gmail-refresh-token error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});


