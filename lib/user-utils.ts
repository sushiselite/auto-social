import { supabase } from './supabase'

export async function ensureUserExists(userId: string, userEmail?: string, userName?: string) {
  try {
    // Check if user exists
    const { error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (checkError && checkError.code === 'PGRST116') {
      // User doesn't exist, create them
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          username: userName || userEmail || 'User',
          created_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error creating user:', insertError)
        throw insertError
      }
      
      console.log('User created successfully')
    } else if (checkError) {
      console.error('Error checking user:', checkError)
      throw checkError
    }
    
    return true
  } catch (error) {
    console.error('Error ensuring user exists:', error)
    return false
  }
} 