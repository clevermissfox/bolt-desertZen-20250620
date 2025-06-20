import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          meditation_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          meditation_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          meditation_id?: string;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      meditations: {
        Row: {
          id: string;
          title: string;
          description: string;
          category_id: string;
          duration_minutes: number;
          audio_url: string;
          image_url: string;
          featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          description: string;
          category_id: string;
          duration_minutes: number;
          audio_url: string;
          image_url: string;
          featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category_id?: string;
          duration_minutes?: number;
          audio_url?: string;
          image_url?: string;
          featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

// Helper types for the app
export interface Meditation {
  id: string;
  title: string;
  description: string;
  category: string;
  length: string;
  audioUrl: string;
  imageUrl: string;
  featured: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}