const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔧 Testing Frontend-like Scenario...')

async function testFrontendScenario() {
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey)
    
    // The exact user ID from your logs
    const userId = '4bfb3c87-7744-4380-b8be-847be838d66f'
    
    console.log('\n1️⃣ Testing transcript insert with exact frontend data...')
    const { data: transcriptData, error: transcriptError } = await client
      .from('transcripts')
      .insert({
        user_id: userId,
        title: 'test',
        content: 'This is a test transcript with enough content to meet the character count requirements. '.repeat(20),
        content_type: 'interview',
        character_count: 1292,
        status: 'processing'
      })
      .select()
      .single()

    if (transcriptError) {
      console.log('❌ Transcript insert failed:', transcriptError.message)
      console.log('💡 Error details:', JSON.stringify(transcriptError, null, 2))
      return
    }
    
    console.log('✅ Transcript insert succeeded:', transcriptData.id)
    
    console.log('\n2️⃣ Testing insights insert...')
    const insightRows = [
      {
        transcript_id: transcriptData.id,
        user_id: userId,
        content: 'Test insight 1',
        speaker_attribution: 'Speaker 1',
        insight_type: 'key_point',
        order_index: 0,
        is_selected: true
      },
      {
        transcript_id: transcriptData.id,
        user_id: userId,
        content: 'Test insight 2',
        speaker_attribution: 'Speaker 2',
        insight_type: 'actionable_tip',
        order_index: 1,
        is_selected: true
      }
    ]

    const { data: savedInsights, error: insightsError } = await client
      .from('insights')
      .insert(insightRows)
      .select()

    if (insightsError) {
      console.log('❌ Insights insert failed:', insightsError.message)
      console.log('💡 Error details:', JSON.stringify(insightsError, null, 2))
    } else {
      console.log('✅ Insights insert succeeded:', savedInsights.length, 'insights')
    }

    console.log('\n3️⃣ Testing tweets insert...')
    const tweetsToInsert = [
      {
        user_id: userId,
        transcript_id: transcriptData.id,
        insight_id: savedInsights[0]?.id,
        content: 'Test tweet 1',
        status: 'generated',
        viral_score: 85,
        authenticity_score: 90,
        engagement_score: 80,
        quality_score: 88
      }
    ]

    const { error: tweetsError } = await client
      .from('tweets')
      .insert(tweetsToInsert)

    if (tweetsError) {
      console.log('❌ Tweets insert failed:', tweetsError.message)
      console.log('💡 Error details:', JSON.stringify(tweetsError, null, 2))
    } else {
      console.log('✅ Tweets insert succeeded')
    }

    console.log('\n4️⃣ Cleaning up test data...')
    await client.from('transcripts').delete().eq('id', transcriptData.id)
    console.log('🧹 Cleaned up test data')
    
    console.log('\n🎉 Frontend scenario test completed successfully!')

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

testFrontendScenario() 