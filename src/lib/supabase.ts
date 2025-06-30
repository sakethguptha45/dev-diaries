import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      cards: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          type: 'note' | 'code' | 'link' | 'file';
          content: string;
          explanation: string;
          links: string[];
          files: any[];
          tags: string[];
          favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          type: 'note' | 'code' | 'link' | 'file';
          content: string;
          explanation: string;
          links: string[];
          files?: any[];
          tags: string[];
          favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          type?: 'note' | 'code' | 'link' | 'file';
          content?: string;
          explanation?: string;
          links?: string[];
          files?: any[];
          tags?: string[];
          favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}