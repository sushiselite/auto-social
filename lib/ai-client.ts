export interface ScoredTweet {
  content: string
  viralScore: number
  scores: {
    authenticity: number
    engagementPrediction: number
    qualitySignals: number
  }
  insights: {
    strengths: string[]
    improvements: string[]
    reasoning: string
  }
}

export interface TweetGenerationOptions {
  idea: string
  trainingExamples?: string[]
  regenerationFeedback?: string
  tone?: string
  style?: string
  targetAudience?: string
  contentMode?: 'thoughtLeadership' | 'communityEngagement' | 'personalBrand' | 'valueFirst'
}

export interface TweetGenerationResponse {
  tweets: ScoredTweet[]
  totalGenerated: number
  scoringEnabled: boolean
  regenerationAttempts?: number
  finalScore?: number
  improvedByRegeneration?: boolean
}

export async function generateTweets(options: TweetGenerationOptions): Promise<TweetGenerationResponse> {
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
    return {
      tweets: data.tweets || [],
      totalGenerated: data.totalGenerated || 0,
      scoringEnabled: data.scoringEnabled || false,
      regenerationAttempts: data.regenerationAttempts || 0,
      finalScore: data.finalScore,
      improvedByRegeneration: data.improvedByRegeneration || false
    }
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

export async function generateTweetFromVoice(
  audioFile: File, 
  trainingExamples?: string[], 
  targetAudience?: string,
  contentMode?: 'thoughtLeadership' | 'communityEngagement' | 'personalBrand' | 'valueFirst'
): Promise<TweetGenerationResponse> {
  try {
    const transcription = await transcribeAudio(audioFile)
    return await generateTweets({
      idea: transcription,
      trainingExamples,
      targetAudience,
      contentMode
    })
  } catch (error) {
    console.error('Error generating tweet from voice:', error)
    throw new Error('Failed to generate tweet from voice')
  }
}

// Demo fallback function
function generateDemoTweets(options: TweetGenerationOptions): TweetGenerationResponse {
  const { idea, tone = 'professional', targetAudience, contentMode = 'thoughtLeadership' } = options
  
  // Enhanced demo templates based on content mode
  const modeTemplates = {
    thoughtLeadership: {
      professional: `After working in this space: ${idea.slice(0, 180)}... What's your take?`,
      casual: `Been thinking about this: ${idea.slice(0, 190)}... Anyone else see this?`,
      humorous: `Hot take: ${idea.slice(0, 200)}... or maybe I'm just overthinking`,
      educational: `Something I've learned: ${idea.slice(0, 180)}... Worth discussing`,
      inspirational: `Key insight: ${idea.slice(0, 200)}... Keep pushing forward`
    },
    communityEngagement: {
      professional: `Question for the community: ${idea.slice(0, 170)}... What's your experience?`,
      casual: `Curious: ${idea.slice(0, 200)}... How do you all handle this?`,
      humorous: `${idea.slice(0, 200)}... or is it just me being weird about this?`,
      educational: `Poll question: ${idea.slice(0, 180)}... What would you choose?`,
      inspirational: `Challenge for everyone: ${idea.slice(0, 170)}... Who's in?`
    },
    personalBrand: {
      professional: `Personal reflection: ${idea.slice(0, 180)}... Still learning`,
      casual: `Real talk: ${idea.slice(0, 200)}... Anyone else relate?`,
      humorous: `Life update: ${idea.slice(0, 180)}... Why is adulting so hard?`,
      educational: `Lesson learned: ${idea.slice(0, 180)}... Sharing in case it helps`,
      inspirational: `Growth moment: ${idea.slice(0, 180)}... Grateful for the journey`
    },
    valueFirst: {
      professional: `Pro tip: ${idea.slice(0, 200)}... Hope this helps someone`,
      casual: `Quick hack: ${idea.slice(0, 200)}... Game changer for me`,
      humorous: `Life hack: ${idea.slice(0, 180)}... Why didn't I think of this sooner?`,
      educational: `How to: ${idea.slice(0, 200)}... Step by step breakdown`,
      inspirational: `Daily reminder: ${idea.slice(0, 180)}... You've got this`
    }
  }

  const templates = modeTemplates[contentMode] || modeTemplates.thoughtLeadership
  let selectedTemplate = templates[tone as keyof typeof templates] || templates.professional
  
  // Adjust for target audience if provided
  if (targetAudience) {
    selectedTemplate = `For ${targetAudience}: ${selectedTemplate}`
  }
  
  const tweetContent = selectedTemplate // Remove character limit
  
  // Create demo scored tweets
  const demoTweets: ScoredTweet[] = [
    {
      content: tweetContent,
      viralScore: 65,
      scores: {
        authenticity: 70,
        engagementPrediction: 60,
        qualitySignals: 65
      },
      insights: {
        strengths: ["Natural conversational tone", "Clear message"],
        improvements: ["Demo mode - limited optimization"],
        reasoning: "Demo content with moderate viral potential"
      }
    }
  ]
  
  return {
    tweets: demoTweets,
    totalGenerated: 1,
    scoringEnabled: false
  }
} 