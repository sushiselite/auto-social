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
    const { insights } = await request.json()

    if (!insights || !Array.isArray(insights)) {
      return NextResponse.json({ error: 'Invalid insights data' }, { status: 400 })
    }

    // Save insights using service role (bypasses RLS)
    const { data: savedInsights, error: insightsError } = await supabaseAdmin
      .from('insights')
      .insert(insights)
      .select()

    if (insightsError) {
      console.error('Insights save error:', insightsError)
      return NextResponse.json({ error: insightsError.message }, { status: 500 })
    }

    return NextResponse.json({ insights: savedInsights })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 