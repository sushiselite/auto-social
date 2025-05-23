-- Add preferences columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Update existing users to have default preferences
UPDATE users 
SET preferences = '{
  "defaultTone": "professional",
  "timezone": "UTC",
  "notifications": true,
  "autoSchedule": false
}'::jsonb 
WHERE preferences IS NULL OR preferences = '{}'; 