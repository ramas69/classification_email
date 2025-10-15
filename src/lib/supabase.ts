import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          company_name: string | null;
          smtp_host: string | null;
          smtp_port: number | null;
          imap_host: string | null;
          imap_port: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          company_name?: string | null;
          smtp_host?: string | null;
          smtp_port?: number | null;
          imap_host?: string | null;
          imap_port?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          company_name?: string | null;
          smtp_host?: string | null;
          smtp_port?: number | null;
          imap_host?: string | null;
          imap_port?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      emails: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          sender_email: string;
          sender_name: string | null;
          subject: string;
          body: string;
          received_at: string;
          is_read: boolean;
          ai_suggested_reply: string | null;
          reply_sent: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          sender_email: string;
          sender_name?: string | null;
          subject: string;
          body: string;
          received_at?: string;
          is_read?: boolean;
          ai_suggested_reply?: string | null;
          reply_sent?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          sender_email?: string;
          sender_name?: string | null;
          subject?: string;
          body?: string;
          received_at?: string;
          is_read?: boolean;
          ai_suggested_reply?: string | null;
          reply_sent?: boolean;
          created_at?: string;
        };
      };
    };
  };
};
