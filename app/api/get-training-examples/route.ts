import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Fetch training examples using service role (bypasses RLS)
    const { data: trainingData, error } = await supabaseAdmin
      .from('training_examples')
      .select('tweet_text')
      .eq('user_id', userId)

    if (error) {
      console.error('Training examples fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const trainingExamples = trainingData?.map(example => example.tweet_text) || []
    return NextResponse.json({ trainingExamples })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 