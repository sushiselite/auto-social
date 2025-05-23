export interface TweetGenerationOptions {
  idea: string
  trainingExamples?: string[]
  regenerationFeedback?: string
  tone?: string
  style?: string
}

export async function generateTweets(options: TweetGenerationOptions): Promise<string[]> {
  const { idea, tone = 'professional' } = options
  
  // Demo tweets based on the idea and tone
  const templates = {
    professional: [
      `${idea.slice(0, 200)}... Thoughts? #Innovation #Business`,
      `Key insight: ${idea.slice(0, 180)}... What's your take? #Strategy`,
      `💡 ${idea.slice(0, 190)}... #ProfessionalDevelopment`
    ],
    casual: [
      `So I was thinking... ${idea.slice(0, 180)} 🤔`,
      `Random thought: ${idea.slice(0, 190)} What do you think?`,
      `Just realized ${idea.slice(0, 200)}... Mind = blown 🤯`
    ],
    humorous: [
      `${idea.slice(0, 180)}... or is it just me? 😅`,
      `Plot twist: ${idea.slice(0, 190)} 🎭`,
      `When you realize ${idea.slice(0, 170)}... 🤣 #Relatable`
    ],
    educational: [
      `Did you know: ${idea.slice(0, 180)}... #Learning #Education`,
      `📚 Today I learned: ${idea.slice(0, 170)}... #Knowledge`,
      `Fun fact: ${idea.slice(0, 190)}... #Education #Facts`
    ],
    inspirational: [
      `Remember: ${idea.slice(0, 190)}... ✨ #Motivation`,
      `💪 ${idea.slice(0, 200)}... You've got this! #Inspiration`,
      `🌟 ${idea.slice(0, 180)}... Keep pushing forward! #Success`
    ]
  }

  return templates[tone as keyof typeof templates] || templates.professional
}

export async function transcribeAudio(audioFile: File): Promise<string> {
  // Demo transcription for development
  await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
  return `This is a demo transcription of your ${Math.round(audioFile.size / 1000)}KB voice recording. In production, this would be the actual transcribed text using OpenAI Whisper.`
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