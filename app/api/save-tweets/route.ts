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
    const { tweets } = await request.json()

    if (!tweets || !Array.isArray(tweets)) {
      return NextResponse.json({ error: 'Invalid tweets data' }, { status: 400 })
    }

    // Save tweets using service role (bypasses RLS)
    const { error: tweetsError } = await supabaseAdmin
      .from('tweets')
      .insert(tweets)

    if (tweetsError) {
      console.error('Tweets save error:', tweetsError)
      return NextResponse.json({ error: tweetsError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 