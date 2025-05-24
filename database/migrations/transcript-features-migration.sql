-- Transcript and Insights Feature Migration
-- Run this after the main viral-scoring-migration.sql

-- Create transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  content_type VARCHAR(50) NOT NULL DEFAULT 'general', -- coaching_call, interview, webinar, meeting, presentation, etc.
  character_count INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'processing', -- processing, completed, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT transcript_content_length CHECK (character_count >= 500 AND character_count <= 50000)
);

-- Create insights table
CREATE TABLE IF NOT EXISTS insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transcript_id UUID NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  speaker_attribution VARCHAR(255), -- Internal use for organizing insights
  insight_type VARCHAR(50) NOT NULL DEFAULT 'key_point', -- key_point, actionable_tip, quote, statistic, lesson_learned
  order_index INTEGER NOT NULL DEFAULT 0,
  is_selected BOOLEAN DEFAULT TRUE, -- Whether user wants to convert this insight to tweets
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add transcript_id and insight_id to tweets table to track origin
ALTER TABLE tweets ADD COLUMN IF NOT EXISTS transcript_id UUID REFERENCES transcripts(id) ON DELETE SET NULL;
ALTER TABLE tweets ADD COLUMN IF NOT EXISTS insight_id UUID REFERENCES insights(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transcripts_user_id ON transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_status ON transcripts(status);
CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON transcripts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_insights_transcript_id ON insights(transcript_id);
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_order_index ON insights(transcript_id, order_index);
CREATE INDEX IF NOT EXISTS idx_insights_selected ON insights(is_selected);

CREATE INDEX IF NOT EXISTS idx_tweets_transcript_id ON tweets(transcript_id);
CREATE INDEX IF NOT EXISTS idx_tweets_insight_id ON tweets(insight_id);

-- Enable RLS (Row Level Security)
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transcripts
CREATE POLICY "Users can view own transcripts" ON transcripts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcripts" ON transcripts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcripts" ON transcripts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcripts" ON transcripts
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for insights
CREATE POLICY "Users can view own insights" ON insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights" ON insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights" ON insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights" ON insights
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_transcripts_updated_at BEFORE UPDATE ON transcripts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insights_updated_at BEFORE UPDATE ON insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 