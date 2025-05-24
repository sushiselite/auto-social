-- Add engagement bait support to tweets table
ALTER TABLE tweets ADD COLUMN IF NOT EXISTS is_engagement_bait BOOLEAN DEFAULT FALSE;

-- Add index for performance when querying engagement bait tweets
CREATE INDEX IF NOT EXISTS idx_tweets_engagement_bait ON tweets(is_engagement_bait); 