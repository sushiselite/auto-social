import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface TwitterTweet {
  id: string
  text: string
  public_metrics: {
    retweet_count: number
    like_count: number
    reply_count: number
    quote_count: number
  }
  created_at: string
}

export async function POST(request: NextRequest) {
  try {
    // Check if Twitter API credentials are configured
    if (!process.env.TWITTER_BEARER_TOKEN) {
      return NextResponse.json(
        { error: 'Twitter API not configured. Please add TWITTER_BEARER_TOKEN to your environment variables.' },
        { status: 500 }
      )
    }

    // Parse the request body once and extract both values
    const { userId, twitterUsername } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!twitterUsername) {
      return NextResponse.json(
        { error: 'Twitter username is required' },
        { status: 400 }
      )
    }

    // First, get the user's Twitter ID
    const userResponse = await fetch(
      `https://api.twitter.com/2/users/by/username/${twitterUsername}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!userResponse.ok) {
      const errorData = await userResponse.json()
      return NextResponse.json(
        { error: 'Failed to fetch Twitter user data', details: errorData },
        { status: userResponse.status }
      )
    }

    const userData = await userResponse.json()
    const twitterUserId = userData.data?.id

    if (!twitterUserId) {
      return NextResponse.json(
        { error: 'Twitter user not found' },
        { status: 404 }
      )
    }

    // Fetch the user's tweets with metrics
    const tweetsResponse = await fetch(
      `https://api.twitter.com/2/users/${twitterUserId}/tweets?max_results=100&tweet.fields=public_metrics,created_at&exclude=retweets,replies`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!tweetsResponse.ok) {
      const errorData = await tweetsResponse.json()
      return NextResponse.json(
        { error: 'Failed to fetch tweets', details: errorData },
        { status: tweetsResponse.status }
      )
    }

    const tweetsData = await tweetsResponse.json()
    const tweets: TwitterTweet[] = tweetsData.data || []

    if (tweets.length === 0) {
      return NextResponse.json(
        { error: 'No tweets found for this user' },
        { status: 404 }
      )
    }

    // Filter and score tweets for training quality
    const qualityTweets = tweets
      .filter(tweet => {
        // Filter out low-quality tweets
        const text = tweet.text.toLowerCase()
        const metrics = tweet.public_metrics
        
        // Must have some engagement
        const totalEngagement = metrics.like_count + metrics.retweet_count + metrics.reply_count + metrics.quote_count
        if (totalEngagement < 2) return false
        
        // Filter out promotional/spammy content
        if (text.includes('http') || text.includes('www.')) return false
        if (text.includes('buy now') || text.includes('click here')) return false
        if (text.includes('dm me') || text.includes('link in bio')) return false
        
        // Must be substantial content (not just emoji or very short)
        if (tweet.text.length < 30) return false
        
        // Avoid tweets that are mostly hashtags
        const hashtagCount = (tweet.text.match(/#/g) || []).length
        if (hashtagCount > 3) return false
        
        return true
      })
      .map(tweet => {
        const metrics = tweet.public_metrics
        
        // Enhanced engagement scoring that favors quality interactions
        const engagementScore = 
          metrics.like_count * 1 +
          metrics.retweet_count * 4 +  // Retweets are high-value
          metrics.reply_count * 3 +    // Replies indicate discussion
          metrics.quote_count * 5      // Quote tweets are highest value
        
        // Bonus for longer, more substantial content
        const lengthBonus = tweet.text.length > 100 ? 10 : 0
        
        // Bonus for original thoughts (no mentions at start)
        const originalityBonus = !tweet.text.startsWith('@') ? 5 : 0

        return {
          ...tweet,
          engagementScore: engagementScore + lengthBonus + originalityBonus
        }
      })

    // Sort by engagement score and take top 10
    const topTweets = qualityTweets
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 10)

    // Check how many training examples the user already has
    const { data: existingExamples, error: fetchError } = await supabase
      .from('training_examples')
      .select('id')
      .eq('user_id', userId)

    if (fetchError) {
      console.error('Error fetching existing examples:', fetchError)
      return NextResponse.json(
        { error: 'Failed to check existing training data' },
        { status: 500 }
      )
    }

    const availableSlots = Math.max(0, 10 - (existingExamples?.length || 0))
    const tweetsToImport = topTweets.slice(0, availableSlots)

    if (tweetsToImport.length === 0) {
      return NextResponse.json(
        { error: 'No available slots for training examples (maximum 10 allowed)' },
        { status: 400 }
      )
    }

    // Insert the tweets as training examples
    const trainingExamples = tweetsToImport.map(tweet => ({
      user_id: userId,
      tweet_text: tweet.text,
    }))

    const { data: insertedExamples, error: insertError } = await supabase
      .from('training_examples')
      .insert(trainingExamples)
      .select()

    if (insertError) {
      console.error('Error inserting training examples:', insertError)
      return NextResponse.json(
        { error: 'Failed to save training examples' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imported: tweetsToImport.length,
      availableSlots,
      examples: insertedExamples,
      topTweets: tweetsToImport.map(tweet => ({
        text: tweet.text,
        engagement: tweet.engagementScore,
        metrics: tweet.public_metrics
      }))
    })

  } catch (error) {
    console.error('Error importing Twitter tweets:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 