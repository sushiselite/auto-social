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
    const { transcriptId, status } = await request.json()

    if (!transcriptId || !status) {
      return NextResponse.json({ error: 'Transcript ID and status are required' }, { status: 400 })
    }

    // Update transcript status using service role (bypasses RLS)
    const { error } = await supabaseAdmin
      .from('transcripts')
      .update({ status })
      .eq('id', transcriptId)

    if (error) {
      console.error('Transcript status update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 