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
    const { userId, title, content, contentType, characterCount } = await request.json()

    if (!userId || !title || !content || !contentType || !characterCount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Save transcript using service role (bypasses RLS)
    const { data: transcriptData, error: transcriptError } = await supabaseAdmin
      .from('transcripts')
      .insert({
        user_id: userId,
        title,
        content,
        content_type: contentType,
        character_count: characterCount,
        status: 'processing'
      })
      .select()
      .single()

    if (transcriptError) {
      console.error('Transcript save error:', transcriptError)
      return NextResponse.json({ error: transcriptError.message }, { status: 500 })
    }

    return NextResponse.json({ transcript: transcriptData })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 