const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔧 Testing Supabase Session Authentication...')

async function testSession() {
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey)
    
    console.log('\n1️⃣ Testing current session...')
    const { data: session } = await client.auth.getSession()
    console.log('📱 Current session:', session.session ? 'Present' : 'None')
    console.log('👤 Current user:', session.session?.user?.id || 'None')
    
    console.log('\n2️⃣ Testing auth.uid() from database...')
    const { data: authTest, error: authError } = await client
      .rpc('auth_uid_test', {})
      .single()
    
    if (authError) {
      console.log('❌ auth.uid() test failed:', authError.message)
      
      // Try direct SQL to get auth.uid()
      console.log('\n3️⃣ Testing direct auth.uid() query...')
      const { data: directAuth, error: directError } = await client
        .from('transcripts')
        .select('id')
        .limit(1)
      
      console.log('Direct query result:', { data: directAuth, error: directError })
      
    } else {
      console.log('✅ auth.uid() returned:', authTest)
    }
    
    console.log('\n4️⃣ Testing if we can create auth.uid() test function...')
    // Let's see if we can at least get some info about the auth state
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

testSession() 