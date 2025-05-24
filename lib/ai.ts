import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export interface TweetGenerationOptions {
  idea: string
  trainingExamples?: string[]
  regenerationFeedback?: string
  tone?: string
  style?: string
}

export async function generateTweets(options: TweetGenerationOptions): Promise<string[]> {
  const { idea, trainingExamples = [], regenerationFeedback, tone, style } = options

  // For development/demo purposes, return mock tweets if API keys aren't configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return [
      `${idea.slice(0, 200)}... #agent #SocialMedia`,
      `Just thinking about: ${idea.slice(0, 180)}... What do you think?`,
      `💡 New insight: ${idea.slice(0, 190)}... #Innovation`
    ]
  }

  let prompt = `You are an expert social media content creator. Generate 3 engaging tweets based on the following idea: "${idea}"`

  if (trainingExamples.length > 0) {
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
- Make them engaging and shareable
- Include relevant hashtags when appropriate
- Vary the style slightly between the 3 options
- Return only the tweet text, separated by "---"`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
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
      return content.text.split('---').map((tweet: string) => tweet.trim()).filter((tweet: string) => tweet.length > 0)
    }
    
    return []
  } catch (error) {
    console.error('Error generating tweets:', error)
    // Return fallback tweets on error
    return [
      `${idea.slice(0, 200)}... #agent #SocialMedia`,
      `Just thinking about: ${idea.slice(0, 180)}... What do you think?`,
      `💡 New insight: ${idea.slice(0, 190)}... #Innovation`
    ]
  }
}

export async function transcribeAudio(audioFile: File): Promise<string> {
  // For development/demo purposes, return mock transcription if API keys aren't configured
  if (!process.env.OPENAI_API_KEY) {
    return "This is a demo transcription of your voice recording. In production, this would be the actual transcribed text from your audio."
  }

  try {
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    })

    return response.text
  } catch (error) {
    console.error('Error transcribing audio:', error)
    return "Unable to transcribe audio. Please check your API configuration."
  }
}

export async function generateTweetFromVoice(audioFile: File, trainingExamples?: string[]): Promise<string[]> {
  try {
    const transcription = await transcribeAudio(audioFile)
    return await generateTweets({
      idea: transcription,
      trainingExamples
    })
  } catch (error) {
    console.error('Error generating tweet from voice:', error)
    throw new Error('Failed to generate tweet from voice')
  }
} 