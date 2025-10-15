import { supabase } from '../lib/supabase';

export type GmailTokenRow = {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_expiry: string; // ISO string from timestamptz
  email: string;
  created_at: string | null;
  updated_at: string | null;
};

export async function getCurrentUserGmailToken(): Promise<GmailTokenRow | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('gmail_tokens')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as GmailTokenRow | null;
}

export async function upsertCurrentUserGmailToken(input: Omit<GmailTokenRow, 'id' | 'created_at' | 'updated_at' | 'user_id'> & { user_id?: string }): Promise<GmailTokenRow> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = input.user_id ?? session?.user?.id;
  if (!userId) throw new Error('Utilisateur non connecté');

  const payload = {
    user_id: userId,
    access_token: input.access_token,
    refresh_token: input.refresh_token,
    token_expiry: input.token_expiry,
    email: input.email,
  };

  const { data, error } = await supabase
    .from('gmail_tokens')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as GmailTokenRow;
}

export async function deleteCurrentUserGmailToken(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return;

  const { error } = await supabase
    .from('gmail_tokens')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
}

export async function ensureValidAccessToken(): Promise<{ access_token: string; token_expiry: string; email: string } | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-refresh-token`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Erreur de rafraîchissement du token Gmail');
  }
  return response.json();
}

export async function getValidGmailAccessToken(): Promise<string> {
  const tokenData = await ensureValidAccessToken();
  if (!tokenData) {
    throw new Error('Aucun token Gmail disponible. Veuillez reconnecter votre compte Gmail.');
  }
  return tokenData.access_token;
}


