-- Add viral scoring columns to tweets table
ALTER TABLE tweets ADD COLUMN IF NOT EXISTS viral_score INTEGER;
ALTER TABLE tweets ADD COLUMN IF NOT EXISTS authenticity_score INTEGER;
ALTER TABLE tweets ADD COLUMN IF NOT EXISTS engagement_score INTEGER;
ALTER TABLE tweets ADD COLUMN IF NOT EXISTS quality_score INTEGER;

-- Add indexes for performance when querying by score
CREATE INDEX IF NOT EXISTS idx_tweets_viral_score ON tweets(viral_score);
CREATE INDEX IF NOT EXISTS idx_tweets_authenticity_score ON tweets(authenticity_score);
CREATE INDEX IF NOT EXISTS idx_tweets_engagement_score ON tweets(engagement_score);
CREATE INDEX IF NOT EXISTS idx_tweets_quality_score ON tweets(quality_score);

-- Add constraints to ensure scores are within 0-100 range
ALTER TABLE tweets ADD CONSTRAINT viral_score_range CHECK (viral_score >= 0 AND viral_score <= 100);
ALTER TABLE tweets ADD CONSTRAINT authenticity_score_range CHECK (authenticity_score >= 0 AND authenticity_score <= 100);
ALTER TABLE tweets ADD CONSTRAINT engagement_score_range CHECK (engagement_score >= 0 AND engagement_score <= 100);
ALTER TABLE tweets ADD CONSTRAINT quality_score_range CHECK (quality_score >= 0 AND quality_score <= 100); 