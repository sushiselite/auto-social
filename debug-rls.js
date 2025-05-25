const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Testing Supabase RLS Configuration...')
console.log('📍 Supabase URL:', supabaseUrl)
console.log('🔑 Using anon key:', supabaseAnonKey ? 'Present' : 'Missing')
console.log('🔑 Using service key:', supabaseServiceKey ? 'Present' : 'Missing')

async function testRLS() {
  try {
    // Test with anon client (this will fail due to RLS)
    console.log('\n1️⃣ Testing with anonymous client...')
    const anonClient = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data: anonData, error: anonError } = await anonClient
      .from('transcripts')
      .insert({
        user_id: '4bfb3c87-7744-4380-b8be-847be838d66f', // Your user ID from logs
        title: 'Test RLS Debug',
        content: 'This is a test transcript with enough content to meet the character count requirements. '.repeat(20),
        content_type: 'interview',
        character_count: 1292,
        status: 'processing'
      })
      .select()
      .single()
    
    if (anonError) {
      console.log('❌ Anonymous client failed (expected):', anonError.message)
    } else {
      console.log('✅ Anonymous client succeeded:', anonData?.id)
    }

    // Test with service role client (this should work)
    console.log('\n2️⃣ Testing with service role client...')
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const { data: serviceData, error: serviceError } = await serviceClient
      .from('transcripts')
      .insert({
        user_id: '4bfb3c87-7744-4380-b8be-847be838d66f',
        title: 'Test Service Role',
        content: 'This is a test transcript with enough content to meet the character count requirements. '.repeat(20),
        content_type: 'interview',
        character_count: 1292,
        status: 'processing'
      })
      .select()
      .single()
    
    if (serviceError) {
      console.log('❌ Service role client failed:', serviceError.message)
      console.log('💡 Details:', serviceError)
    } else {
      console.log('✅ Service role client succeeded:', serviceData?.id)
      
      // Clean up the test record
      await serviceClient
        .from('transcripts')
        .delete()
        .eq('id', serviceData.id)
      console.log('🧹 Cleaned up test record')
    }

    // Test RLS policies directly
    console.log('\n3️⃣ Checking RLS policies...')
    const { data: policies, error: policyError } = await serviceClient
      .rpc('exec_sql', { 
        sql: `SELECT tablename, policyname, permissive, cmd, qual, with_check FROM pg_policies WHERE tablename = 'transcripts'` 
      })
    
    if (policies) {
      console.log('📋 Current RLS policies:', JSON.stringify(policies, null, 2))
    } else {
      console.log('❌ Could not fetch policies:', policyError)
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

testRLS() 