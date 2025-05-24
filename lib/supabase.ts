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
          preferences: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          preferences?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          preferences?: Record<string, unknown> | null
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
          performance: Record<string, unknown> | null
          viral_score: number | null
          authenticity_score: number | null
          engagement_score: number | null
          quality_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          idea_id?: string | null
          content?: string | null
          status?: string | null
          scheduled_time?: string | null
          performance?: Record<string, unknown> | null
          viral_score?: number | null
          authenticity_score?: number | null
          engagement_score?: number | null
          quality_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          idea_id?: string | null
          content?: string | null
          status?: string | null
          scheduled_time?: string | null
          performance?: Record<string, unknown> | null
          viral_score?: number | null
          authenticity_score?: number | null
          engagement_score?: number | null
          quality_score?: number | null
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
      transcripts: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          content_type: string
          character_count: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          content_type: string
          character_count: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          content_type?: string
          character_count?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      insights: {
        Row: {
          id: string
          transcript_id: string
          user_id: string
          content: string
          speaker_attribution: string | null
          insight_type: string
          order_index: number
          is_selected: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transcript_id: string
          user_id: string
          content: string
          speaker_attribution?: string | null
          insight_type?: string
          order_index?: number
          is_selected?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transcript_id?: string
          user_id?: string
          content?: string
          speaker_attribution?: string | null
          insight_type?: string
          order_index?: number
          is_selected?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 