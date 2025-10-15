import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      return new Response(
        JSON.stringify({ error: 'Missing code or state parameter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const stateData = JSON.parse(atob(state));
    const { userId } = stateData;

    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: googleClientId!,
        client_secret: googleClientSecret!,
        redirect_uri: `${supabaseUrl}/functions/v1/gmail-oauth-callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${JSON.stringify(tokens)}`);
    }

    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    const userInfo = await userInfoResponse.json();

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);

    const { data: tokenData, error: dbError } = await supabase
      .from('gmail_tokens')
      .upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: expiryDate.toISOString(),
        email: userInfo.email,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    const { error: configError } = await supabase
      .from('email_configurations')
      .upsert({
        user_id: userId,
        name: `Gmail - ${userInfo.email}`,
        email: userInfo.email,
        provider: 'gmail',
        is_connected: true,
        gmail_token_id: tokenData.id,
        last_sync_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (configError) {
      console.error('Error creating email configuration:', configError);
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connexion reussie</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 20px;
      }
      .card {
        background: white;
        border-radius: 16px;
        padding: 40px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 100%;
        animation: slideIn 0.4s ease-out;
      }
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #34D399 0%, #10B981 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 24px;
        animation: checkmark 0.6s ease-in-out 0.2s both;
      }
      @keyframes checkmark {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); opacity: 1; }
      }
      .checkmark {
        width: 40px;
        height: 40px;
        stroke: white;
        stroke-width: 3;
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .checkmark-path {
        stroke-dasharray: 50;
        stroke-dashoffset: 50;
        animation: draw 0.5s ease-out 0.4s forwards;
      }
      @keyframes draw {
        to { stroke-dashoffset: 0; }
      }
      h1 {
        font-size: 24px;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 8px;
      }
      p {
        font-size: 16px;
        color: #6b7280;
        margin-bottom: 8px;
      }
      .email {
        font-size: 14px;
        color: #9ca3af;
        font-weight: 500;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="icon">
        <svg class="checkmark" viewBox="0 0 52 52">
          <path class="checkmark-path" d="M14 27l10 10 20-20"/>
        </svg>
      </div>
      <h1>Connexion reussie !</h1>
      <p>Votre compte Gmail a ete connecte</p>
      <p class="email">${userInfo.email}</p>
    </div>
    <script>
      (function() {
        if (window.opener) {
          try {
            window.opener.postMessage({
              type: 'gmail-connected',
              email: '${userInfo.email}'
            }, '*');
          } catch (e) {
            console.error('Failed to send message:', e);
          }
        }
        setTimeout(function() {
          window.close();
        }, 2000);
      })();
    </script>
  </body>
</html>`;

    return new Response(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error in Gmail OAuth callback:', error);
    
    const errorHtml = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Erreur</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #fee;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 20px;
      }
      .error {
        background: white;
        border-radius: 12px;
        padding: 32px;
        text-align: center;
        border: 2px solid #ef4444;
        max-width: 400px;
      }
      h1 { color: #dc2626; margin-bottom: 12px; }
      p { color: #6b7280; }
    </style>
  </head>
  <body>
    <div class="error">
      <h1>Erreur de connexion</h1>
      <p>${error.message}</p>
    </div>
  </body>
</html>`;

    return new Response(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  }
});