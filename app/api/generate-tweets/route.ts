import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    const { idea, trainingExamples, regenerationFeedback, tone, style } = await request.json()

    let prompt = `You are an expert social media content creator. Generate 1 engaging tweet based on the following idea: "${idea}"`

    if (trainingExamples && trainingExamples.length > 0) {
      prompt += `\n\nPlease match the tone, style, and structure of these example tweets:\n${trainingExamples.join('\n')}`
    }

    if (regenerationFeedback) {
      prompt += `\n\nUser feedback for improvement: ${regenerationFeedback}`
    }

    if (tone) {
      prompt += `\n\nTone: ${tone}`
    }

    if (style) {
      prompt += `\n\nStyle: ${style}`
    }

    prompt += `\n\nRequirements:
- The tweet must be under 280 characters
- Make it engaging and shareable
- Include relevant hashtags when appropriate
- Return only the tweet text without any separators or extra formatting`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      const tweet = content.text.trim()
      return NextResponse.json({ tweets: [tweet] })
    }
    
    return NextResponse.json({ tweets: [] })
  } catch (error) {
    console.error('Error generating tweets:', error)
    return NextResponse.json(
      { error: 'Failed to generate tweets' },
      { status: 500 }
    )
  }
} 