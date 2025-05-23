import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string | null
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          created_at?: string
        }
      }
      ideas: {
        Row: {
          id: string
          user_id: string | null
          content: string | null
          type: string | null
          audio_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          content?: string | null
          type?: string | null
          audio_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          content?: string | null
          type?: string | null
          audio_url?: string | null
          created_at?: string
        }
      }
      tweets: {
        Row: {
          id: string
          user_id: string | null
          idea_id: string | null
          content: string | null
          status: string | null
          scheduled_time: string | null
          performance: any | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          idea_id?: string | null
          content?: string | null
          status?: string | null
          scheduled_time?: string | null
          performance?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          idea_id?: string | null
          content?: string | null
          status?: string | null
          scheduled_time?: string | null
          performance?: any | null
          created_at?: string
        }
      }
      tweet_feedback: {
        Row: {
          id: string
          tweet_id: string | null
          user_id: string | null
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tweet_id?: string | null
          user_id?: string | null
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tweet_id?: string | null
          user_id?: string | null
          comment?: string | null
          created_at?: string
        }
      }
      training_examples: {
        Row: {
          id: string
          user_id: string | null
          tweet_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          tweet_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          tweet_text?: string | null
          created_at?: string
        }
      }
    }
  }
} 