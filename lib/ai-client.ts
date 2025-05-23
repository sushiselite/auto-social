export interface TweetGenerationOptions {
  idea: string
  trainingExamples?: string[]
  regenerationFeedback?: string
  tone?: string
  style?: string
}

export async function generateTweets(options: TweetGenerationOptions): Promise<string[]> {
  try {
    const response = await fetch('/api/generate-tweets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
          // Fall back to demo mode if API fails
    console.warn('Agent API unavailable, using demo mode')
      return generateDemoTweets(options)
    }

    const data = await response.json()
    return data.tweets || []
  } catch (error) {
    console.error('Error calling tweet generation API:', error)
    // Fall back to demo mode
    return generateDemoTweets(options)
  }
}

export async function transcribeAudio(audioFile: File): Promise<string> {
  try {
    const formData = new FormData()
    formData.append('audio', audioFile)

    const response = await fetch('/api/transcribe-audio', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Transcription API failed')
    }

    const data = await response.json()
    return data.transcription
  } catch (error) {
    console.error('Error transcribing audio:', error)
    // Fall back to demo mode
    return `This is a demo transcription of your ${Math.round(audioFile.size / 1000)}KB voice recording. To enable real transcription, please configure your OpenAI API key.`
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

// Demo fallback function
function generateDemoTweets(options: TweetGenerationOptions): string[] {
  const { idea, tone = 'professional' } = options
  
  const templates = {
    professional: `${idea.slice(0, 200)}... Thoughts? #Innovation #Business`,
    casual: `So I was thinking... ${idea.slice(0, 180)} 🤔`,
    humorous: `${idea.slice(0, 180)}... or is it just me? 😅`,
    educational: `Did you know: ${idea.slice(0, 180)}... #Learning #Education`,
    inspirational: `Remember: ${idea.slice(0, 190)}... ✨ #Motivation`
  }

  const selectedTemplate = templates[tone as keyof typeof templates] || templates.professional
  return [selectedTemplate]
} 