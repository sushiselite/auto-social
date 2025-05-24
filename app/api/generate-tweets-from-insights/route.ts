import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { rankTweetsByViralPotential, ScoredTweet } from '@/lib/viral-scoring'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface InsightData {
  id: string
  content: string
  insight_type: string
  speaker_attribution?: string
}

interface TweetGenerationRequest {
  insights: InsightData[]
  contentMode: 'thoughtLeadership' | 'communityEngagement' | 'personalBrand' | 'valueFirst' | 'engagementBait'
  tone: string
  targetAudience?: string
  trainingExamples?: string[]
}

export async function POST(request: NextRequest) {
  console.log('🔥 Tweet generation API called')
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ Anthropic API key not configured')
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    const { insights, contentMode, tone, targetAudience, trainingExamples = [] }: TweetGenerationRequest = await request.json()
    console.log('📥 Request payload:', { 
      insightsCount: insights?.length, 
      contentMode, 
      tone, 
      targetAudience, 
      trainingExamplesCount: trainingExamples?.length 
    })

    if (!insights || insights.length === 0) {
      console.error('❌ No insights provided')
      return NextResponse.json(
        { error: 'No insights provided for tweet generation' },
        { status: 400 }
      )
    }

    console.log('🤖 Starting tweet generation for', insights.length, 'insights')
    // Generate tweets for each insight
    const tweetPromises = insights.map(async (insight) => {
      const prompt = `You are an expert social media strategist specializing in creating authentic, high-performing Twitter content from extracted insights.

PLATFORM OPTIMIZATION CONTEXT:
Twitter's algorithm prioritizes authentic content that generates genuine engagement. Your content will be evaluated on authenticity signals, engagement potential, and value delivery.

CONTENT MODE: ${contentMode.toUpperCase()}
${getContentModeDescription(contentMode)}

INSIGHT TO TRANSFORM:
"${insight.content}"

INSIGHT TYPE: ${insight.insight_type}
${insight.speaker_attribution ? `ORIGINAL SPEAKER: ${insight.speaker_attribution}` : ''}

${targetAudience ? `TARGET AUDIENCE: ${targetAudience}` : ''}

${trainingExamples.length > 0 ? `
PERSONAL VOICE & STYLE EXAMPLES:
Analyze these examples to understand the author's writing style, tone, and personality. Match these patterns exactly:

${trainingExamples.slice(0, 3).map((example: string, index: number) => `${index + 1}. "${example}"`).join('\n')}

STYLE ANALYSIS:
- Notice the sentence structure, length, and rhythm
- Observe the vocabulary level and word choices  
- Pay attention to how opinions are expressed
- Match the level of formality/casualness
- Replicate the conversational style and personality` : ''}

TWEET GENERATION REQUIREMENTS:

VIRAL OPTIMIZATION (Auto-applied):
- AUTHENTICITY SIGNALS: Use personal voice ("I", "my", "personally"), include emotional honesty, show vulnerability when appropriate, avoid AI-typical phrases ("leverage", "utilize", "delve into")
- ENGAGEMENT HOOKS: ${getEngagementHooks(contentMode)}
- CONVERSATIONAL TONE: Use natural, human language with conversational words ("think", "feel", "honestly", "personally")
- SPECIFIC DETAILS: Include numbers, timeframes, specific examples instead of vague language
- EMOTIONAL CONNECTION: Show genuine human emotions and experiences when relevant

INSIGHT-SPECIFIC OPTIMIZATION:
${getInsightTypeGuidance(insight.insight_type)}

TWEEPCREED OPTIMIZATION (Critical for platform success):
- Transform the insight into content that signals authentic human authorship
- Generate natural engagement patterns (replies, discussions, shares)
- Avoid AI-typical phrases, corporate speak, or templated language
- Build genuine connection with the target audience
- Make it sound like the user's authentic voice sharing this insight

AUTHENTICITY SIGNALS:
- Write like a real human sharing a genuine insight or realization
- Use natural, conversational language that flows smoothly
- Include subtle imperfections that make it feel human (but keep it grammatically correct)
- Make it sound like something the person would actually say
- Show personality and authentic voice

TECHNICAL CONSTRAINTS:
- NO emojis, NO hashtags, NO links
- Optimal length: 100-150 characters for best engagement
- Perfect grammar and spelling
- Clear, readable sentence structure

TONE: ${tone}

Generate exactly ONE optimized tweet that transforms this insight into viral content while maintaining authenticity and the user's voice.

IMPORTANT: Don't just repost the insight - transform it into engaging social media content that would naturally generate discussion, shares, or replies. Add context, personal perspective, or engaging framing as needed.

Return ONLY the single tweet with no additional formatting, quotes, or explanations.`

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response format from AI')
      }

      const tweetContent = content.text.trim()
      
      // Create scored tweet object
      const scoredTweet: ScoredTweet = {
        content: tweetContent,
        viralScore: 0,
        scores: {
          authenticity: 0,
          engagementPrediction: 0,
          qualitySignals: 0
        },
        insights: {
          strengths: [],
          improvements: [],
          reasoning: ''
        }
      }

      return { tweet: scoredTweet, insightId: insight.id }
    })

    // Wait for all tweets to be generated
    const tweetResults = await Promise.all(tweetPromises)
    console.log('✅ Tweet generation completed for', tweetResults.length, 'tweets')

    // Extract tweets for scoring
    const tweets = tweetResults.map(result => result.tweet.content)
    console.log('🎯 Starting viral scoring...')

    // Define scoring context
    const scoringContext = {
      contentMode: contentMode as 'thoughtLeadership' | 'communityEngagement' | 'personalBrand' | 'valueFirst',
      targetAudience,
      tone,
      trainingExamples
    }

    // Apply viral scoring
    const rankedTweets = rankTweetsByViralPotential(tweets, scoringContext)
    console.log('✅ Viral scoring completed')

    // Combine with insight IDs
    const tweetsWithInsights = tweetResults.map((result, index) => ({
      tweet: rankedTweets[index],
      insightId: result.insightId
    }))

    console.log('🚀 Returning', tweetsWithInsights.length, 'generated tweets')
    return NextResponse.json({
      tweets: tweetsWithInsights,
      totalGenerated: tweetsWithInsights.length,
      scoringEnabled: true
    })

  } catch (error) {
    console.error('Error generating tweets from insights:', error)
    return NextResponse.json(
      { error: 'Failed to generate tweets from insights' },
      { status: 500 }
    )
  }
}

function getContentModeDescription(mode: string): string {
  const descriptions = {
    thoughtLeadership: "Create authoritative, insightful content that positions the author as a knowledgeable expert in their field.",
    communityEngagement: "Create content that fosters discussion and builds genuine connections with the audience.",
    personalBrand: "Create authentic content that showcases the author's personality, journey, and unique perspective.",
    valueFirst: "Create practical, actionable content that helps the audience solve problems or learn something new.",
    engagementBait: "Create provocative content designed to generate high engagement through controversy or strong opinions."
  }
  return descriptions[mode as keyof typeof descriptions] || descriptions.thoughtLeadership
}

function getEngagementHooks(mode: string): string {
  const hooks = {
    thoughtLeadership: "Include opinion statements or contrarian views that invite expert discussion",
    communityEngagement: "Always include questions or calls-to-action that encourage audience participation",
    personalBrand: "Share personal stories and experiences that build authentic connection",
    valueFirst: "Provide specific, actionable insights that offer immediate value",
    engagementBait: "Use controversial or polarizing statements that generate strong reactions"
  }
  return hooks[mode as keyof typeof hooks] || hooks.thoughtLeadership
}

function getInsightTypeGuidance(insightType: string): string {
  const guidance = {
    key_point: "Transform this central idea into a compelling perspective or observation that sparks discussion",
    actionable_tip: "Present this advice in a way that feels immediately useful and practical to the audience",
    quote: "Reframe this quote to feel like a personal insight or realization rather than just repeating it",
    statistic: "Use this data point to support a broader argument or surprising revelation",
    lesson_learned: "Share this lesson as a personal growth moment that others can relate to and learn from"
  }
  return guidance[insightType as keyof typeof guidance] || guidance.key_point
} 