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
PERSONAL VOICE & STYLE TRAINING:
Here are examples of the author's authentic writing style. Study these carefully and replicate the patterns:

${trainingExamples.map((example: string, index: number) => `${index + 1}. "${example}"`).join('\n')}

${analyzeWritingStyle(trainingExamples)}

CRITICAL: The generated tweet MUST sound like it was written by the same person who wrote these examples. Match their voice, rhythm, and style exactly.

STYLE REPLICATION PROCESS:
1. Identify the author's unique voice patterns from the examples above
2. Note their preferred sentence structures and word choices
3. Match their level of formality and emotional expression
4. Replicate their engagement style and personality traits
5. Ensure the output feels authentically written by the same person` : ''}

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

function analyzeWritingStyle(trainingExamples: string[]): string {
  if (trainingExamples.length === 0) return ''
  
  // Analyze patterns across all examples
  const avgLength = Math.round(trainingExamples.reduce((sum, ex) => sum + ex.length, 0) / trainingExamples.length)
  
  // Common patterns analysis
  const hasPersonalPronouns = trainingExamples.some(ex => /\b(I|my|me|personally)\b/i.test(ex))
  const hasQuestions = trainingExamples.some(ex => ex.includes('?'))
  const hasEmojis = trainingExamples.some(ex => /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(ex))
  const hasHashtags = trainingExamples.some(ex => ex.includes('#'))
  const hasNumbers = trainingExamples.some(ex => /\d/.test(ex))
  
  // Sentence structure analysis
  const shortSentences = trainingExamples.filter(ex => ex.split(/[.!?]/).length <= 2).length
  const longSentences = trainingExamples.filter(ex => ex.split(/[.!?]/).length > 3).length
  
  // Tone indicators
  const hasExclamation = trainingExamples.some(ex => ex.includes('!'))
  const hasCasualLanguage = trainingExamples.some(ex => /\b(gonna|wanna|kinda|sorta|tbh|ngl)\b/i.test(ex))
  const hasFormalLanguage = trainingExamples.some(ex => /\b(furthermore|however|therefore|consequently)\b/i.test(ex))
  
  return `
EXTRACTED STYLE PATTERNS:
- Average content length: ${avgLength} characters
- Sentence structure: ${shortSentences > longSentences ? 'Prefers short, punchy sentences' : longSentences > shortSentences ? 'Uses longer, complex sentences' : 'Mixed sentence lengths'}
- Personal voice: ${hasPersonalPronouns ? 'Uses personal pronouns frequently (I, my, me)' : 'More objective, less personal tone'}
- Engagement style: ${hasQuestions ? 'Often asks questions to engage audience' : 'Primarily makes statements'}
- Formality level: ${hasFormalLanguage ? 'Formal, professional language' : hasCasualLanguage ? 'Casual, conversational tone' : 'Balanced formality'}
- Emotional expression: ${hasExclamation ? 'Uses exclamation points for emphasis' : 'More subdued emotional expression'}
- Visual elements: ${hasEmojis ? 'Includes emojis' : 'Text-only style'}${hasHashtags ? ', Uses hashtags' : ''}
- Data usage: ${hasNumbers ? 'Incorporates specific numbers/data' : 'Focuses on concepts over data'}

REPLICATION INSTRUCTIONS:
- Match the typical length of ${avgLength} characters
- ${hasPersonalPronouns ? 'Use personal pronouns to maintain authentic voice' : 'Maintain objective tone without personal pronouns'}
- ${hasQuestions ? 'Include engaging questions when appropriate' : 'Focus on declarative statements'}
- ${hasCasualLanguage ? 'Use conversational, casual language' : hasFormalLanguage ? 'Maintain professional, formal tone' : 'Balance casual and professional language'}
- ${hasExclamation ? 'Use exclamation points for emphasis and energy' : 'Keep punctuation subdued'}
- ${hasEmojis ? 'Include relevant emojis sparingly' : 'Avoid emojis'}
- ${hasNumbers ? 'Include specific numbers or data when relevant' : 'Focus on conceptual content'}`
} 