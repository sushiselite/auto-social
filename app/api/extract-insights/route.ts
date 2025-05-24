import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface ExtractedInsight {
  content: string
  speaker_attribution?: string
  insight_type: 'key_point' | 'actionable_tip' | 'quote' | 'statistic' | 'lesson_learned'
  order_index: number
}

export interface InsightExtractionResponse {
  insights: ExtractedInsight[]
  total_extracted: number
  content_summary: string
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    const { transcript, contentType = 'general' } = await request.json()

    if (!transcript || transcript.trim().length < 500) {
      return NextResponse.json(
        { error: 'Transcript must be at least 500 characters long' },
        { status: 400 }
      )
    }

    if (transcript.length > 50000) {
      return NextResponse.json(
        { error: 'Transcript must be less than 50,000 characters' },
        { status: 400 }
      )
    }

    // Enhanced prompt for insight extraction with multi-modal approach
    const prompt = `You are an expert content analyst specializing in extracting key insights from ${contentType} transcripts for social media content creation.

TRANSCRIPT TO ANALYZE:
"${transcript}"

CONTENT TYPE: ${contentType}

YOUR TASK:
Extract exactly 3-5 of the most valuable, tweetable insights from this transcript. Focus on insights that would make compelling social media content.

INSIGHT EXTRACTION GUIDELINES:

1. PRIORITIZE VALUE:
   - Actionable advice or tips
   - Surprising statistics or data points
   - Memorable quotes or key statements
   - Important lessons learned or realizations
   - Contrarian or thought-provoking viewpoints

2. SOCIAL MEDIA OPTIMIZATION:
   - Extract insights that would naturally engage an audience
   - Look for content that could spark discussion or shares
   - Prioritize insights that are self-contained and understandable
   - Focus on universal truths or widely relatable concepts

3. SPEAKER ATTRIBUTION:
   - If multiple speakers are present, identify who said what
   - Look for speaker names, introductions, or context clues
   - If no clear speaker attribution exists, leave blank
   - Common patterns: "John:", "As Sarah mentioned", "The host said", etc.

4. INSIGHT CATEGORIZATION:
   - key_point: Main ideas, central themes, important observations
   - actionable_tip: Specific advice, how-to guidance, practical steps
   - quote: Memorable statements, powerful phrases, quotable moments
   - statistic: Numbers, data points, research findings, metrics
   - lesson_learned: Personal growth insights, mistakes to avoid, wisdom gained

5. CONTENT TYPE SPECIFIC FOCUS:
   ${contentType === 'coaching_call' ? '- Focus on personal development insights, breakthrough moments, coaching advice' :
     contentType === 'interview' ? '- Focus on expert insights, unique perspectives, key revelations' :
     contentType === 'webinar' ? '- Focus on educational content, key takeaways, practical applications' :
     contentType === 'meeting' ? '- Focus on decisions made, action items, important discussions' :
     contentType === 'presentation' ? '- Focus on main points, key data, compelling arguments' :
     '- Focus on the most valuable and shareable insights regardless of format'}

RESPONSE FORMAT:
Return a JSON object with exactly this structure:

{
  "insights": [
    {
      "content": "The actual insight text (should be tweet-ready length, 50-200 characters)",
      "speaker_attribution": "Speaker name or null if unknown",
      "insight_type": "one of: key_point, actionable_tip, quote, statistic, lesson_learned",
      "order_index": 0
    }
  ],
  "total_extracted": 0,
  "content_summary": "Brief 1-2 sentence summary of the overall transcript content"
}

QUALITY REQUIREMENTS:
- Each insight should be substantial enough to create engaging social media content
- Insights should be clear and self-contained (understandable without full context)
- Vary the insight types when possible for content diversity
- Order insights by importance/impact (most valuable first)
- Ensure insights are factually accurate and represent the transcript content

Extract the 3-5 most valuable insights now. Return ONLY the JSON response, no additional text.`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3, // Lower temperature for more consistent extraction
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

    let parsedResponse: InsightExtractionResponse
    try {
      parsedResponse = JSON.parse(content.text)
    } catch {
      console.error('Failed to parse AI response:', content.text)
      throw new Error('Failed to parse insights from AI response')
    }

    // Validate and sanitize the response
    if (!parsedResponse.insights || !Array.isArray(parsedResponse.insights)) {
      throw new Error('Invalid insights format in AI response')
    }

    // Ensure we have 3-5 insights and proper formatting
    const validInsights = parsedResponse.insights
      .filter(insight => insight.content && insight.content.trim().length > 10)
      .slice(0, 5) // Max 5 insights
      .map((insight, index) => ({
        content: insight.content.trim(),
        speaker_attribution: insight.speaker_attribution || null,
        insight_type: insight.insight_type || 'key_point',
        order_index: index
      }))

    if (validInsights.length < 3) {
      // Fallback: create basic insights from transcript segments
      const segments = transcript.split(/[.!?]+/).filter((s: string) => s.trim().length > 50)
      const fallbackInsights = segments.slice(0, 3).map((segment: string, index: number) => ({
        content: segment.trim().substring(0, 200) + (segment.length > 200 ? '...' : ''),
        speaker_attribution: null,
        insight_type: 'key_point' as const,
        order_index: index
      }))
      
      return NextResponse.json({
        insights: fallbackInsights,
        total_extracted: fallbackInsights.length,
        content_summary: parsedResponse.content_summary || 'Key insights extracted from transcript'
      })
    }

    return NextResponse.json({
      insights: validInsights,
      total_extracted: validInsights.length,
      content_summary: parsedResponse.content_summary || 'Key insights extracted from transcript'
    })

  } catch (error) {
    console.error('Error extracting insights:', error)
    return NextResponse.json(
      { error: 'Failed to extract insights from transcript' },
      { status: 500 }
    )
  }
} 