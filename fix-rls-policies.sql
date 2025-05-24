-- Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'transcripts';

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own transcripts" ON transcripts;
DROP POLICY IF EXISTS "Users can insert own transcripts" ON transcripts;
DROP POLICY IF EXISTS "Users can update own transcripts" ON transcripts;
DROP POLICY IF EXISTS "Users can delete own transcripts" ON transcripts;

-- Create proper RLS policies with correct syntax
CREATE POLICY "Users can view own transcripts" ON transcripts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcripts" ON transcripts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcripts" ON transcripts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcripts" ON transcripts
  FOR DELETE USING (auth.uid() = user_id);

-- Also fix insights table policies
DROP POLICY IF EXISTS "Users can view own insights" ON insights;
DROP POLICY IF EXISTS "Users can insert own insights" ON insights;
DROP POLICY IF EXISTS "Users can update own insights" ON insights;
DROP POLICY IF EXISTS "Users can delete own insights" ON insights;

CREATE POLICY "Users can view own insights" ON insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights" ON insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights" ON insights
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights" ON insights
  FOR DELETE USING (auth.uid() = user_id);

-- Check if policies were created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('transcripts', 'insights'); 