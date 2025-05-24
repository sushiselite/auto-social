// Viral Potential Scoring System v2.0
// Balanced scoring optimized for realistic viral potential assessment

export interface ScoredTweet {
  content: string
  viralScore: number
  scores: {
    authenticity: number      // 40% weight - Human-like writing, natural flow
    engagementPrediction: number  // 35% weight - Reply potential, shareability
    qualitySignals: number    // 25% weight - Readability, clarity, value
  }
  insights: {
    strengths: string[]
    improvements: string[]
    reasoning: string
  }
}

export interface ScoringContext {
  contentMode: 'thoughtLeadership' | 'communityEngagement' | 'personalBrand' | 'valueFirst'
  targetAudience?: string
  tone?: string
  trainingExamples?: string[]
}

// Enhanced word lists for better pattern matching
const WORD_PATTERNS = {
  conversational: ['think', 'feel', 'believe', 'wonder', 'notice', 'realize', 'learned', 'found', 'honestly', 'personally', 'actually', 'really', 'pretty', 'quite', 'seem', 'tend'],
  personal: ['i ', 'my ', 'me ', 'myself', 'i\'ve', 'i\'m', 'i\'ll', 'i\'d'],
  collective: ['we ', 'our ', 'us ', 'ourselves', 'we\'ve', 'we\'re', 'we\'ll'],
  aiTypical: ['delve into', 'leverage', 'utilize', 'furthermore', 'in conclusion', 'moreover', 'comprehensive', 'holistic', 'seamless', 'robust', 'endeavor', 'facilitate', 'optimize', 'streamline'],
  corporate: ['best practices', 'value proposition', 'stakeholders', 'ecosystem', 'end-to-end', 'cutting-edge', 'state-of-the-art', 'synergy', 'paradigm shift', 'actionable insights'],
  authentic: ['struggled', 'failed', 'mistake', 'wrong', 'confused', 'surprised', 'grateful', 'proud', 'disappointed', 'excited', 'frustrated'],
  promotional: ['amazing', 'incredible', 'revolutionary', 'perfect', 'guarantee', 'secret', 'exclusive', 'breakthrough', 'game-changing', 'life-changing'],
  engagement: ['what do you think', 'agree or disagree', 'thoughts?', 'let me know', 'share your', 'tell me', 'anyone else', 'am i the only one'],
  relatable: ['anyone else', 'we all', 'everyone knows', 'most people', 'pretty much everyone', 'i\'m not the only one'],
  valueWords: ['tip', 'hack', 'learned', 'discovered', 'found', 'works', 'helps', 'useful', 'lesson', 'insight'],
  storytelling: ['yesterday', 'today', 'last week', 'just happened', 'story time', 'experience', 'journey', 'when i', 'back when'],
  emotion: ['love', 'hate', 'excited', 'frustrated', 'shocked', 'amazed', 'thrilled', 'devastated', 'proud', 'grateful']
}

// Authenticity scoring (40% of total score)
function scoreAuthenticity(tweet: string, context: ScoringContext): { score: number, insights: string[] } {
  let score = 50 // Much more reasonable base score
  const insights: string[] = []
  const lowerTweet = tweet.toLowerCase()
  
  // Human voice indicators (0-25 points)
  let humanVoiceScore = 0
  
  // Personal pronouns (strong authenticity signal)
  const hasPersonal = WORD_PATTERNS.personal.some(word => lowerTweet.includes(word))
  const hasCollective = WORD_PATTERNS.collective.some(word => lowerTweet.includes(word))
  
  if (hasPersonal) {
    humanVoiceScore += 12
    insights.push("Personal voice creates authentic connection")
  }
  if (hasCollective && context.contentMode === 'communityEngagement') {
    humanVoiceScore += 8
    insights.push("Collective language builds community")
  }
  
  // Conversational tone
  const conversationalCount = WORD_PATTERNS.conversational.filter(word => lowerTweet.includes(word)).length
  if (conversationalCount >= 2) {
    humanVoiceScore += 10
    insights.push("Strong conversational tone enhances relatability")
  } else if (conversationalCount === 1) {
    humanVoiceScore += 5
    insights.push("Good conversational elements present")
  }
  
  // Authentic emotional expression
  const hasAuthentic = WORD_PATTERNS.authentic.some(word => lowerTweet.includes(word))
  if (hasAuthentic) {
    humanVoiceScore += 8
    insights.push("Authentic emotional expression builds trust")
  }
  
  score += humanVoiceScore
  
  // AI and corporate speak penalties (-15 to -30 points, more moderate)
  const hasAI = WORD_PATTERNS.aiTypical.some(phrase => lowerTweet.includes(phrase))
  const hasCorporate = WORD_PATTERNS.corporate.some(phrase => lowerTweet.includes(phrase))
  
  if (hasAI) {
    score -= 15
    insights.push("AI-typical language reduces authenticity")
  }
  if (hasCorporate) {
    score -= 12
    insights.push("Corporate jargon may feel impersonal")
  }
  
  // Over-promotional content penalty
  const promotionalCount = WORD_PATTERNS.promotional.filter(word => lowerTweet.includes(word)).length
  if (promotionalCount >= 2) {
    score -= 15
    insights.push("Heavy promotional language reduces credibility")
  } else if (promotionalCount === 1) {
    score -= 5
    insights.push("Moderate promotional tone detected")
  }
  
  // Length optimization (more forgiving ranges)
  if (tweet.length >= 60 && tweet.length <= 200) {
    score += 10
    insights.push("Optimal length for authentic engagement")
  } else if (tweet.length >= 40 && tweet.length <= 280) {
    score += 5
    insights.push("Good length for readability")
  } else if (tweet.length < 40) {
    score -= 8
    insights.push("May be too brief for meaningful expression")
  }
  
  // Natural punctuation and structure
  const punctTypes = ['.', '!', '?', ',', ':'].filter(p => tweet.includes(p)).length
  if (punctTypes >= 2) {
    score += 8
    insights.push("Natural punctuation variety")
  }
  
  // Caps lock check (more lenient)
  const capsRatio = (tweet.match(/[A-Z]/g) || []).length / (tweet.match(/[a-zA-Z]/g) || []).length
  if (capsRatio > 0.4) {
    score -= 10
    insights.push("Excessive capitalization may appear unprofessional")
  }
  
  return { score: Math.min(100, Math.max(0, score)), insights }
}

// Engagement prediction scoring (35% of total score)
function scoreEngagementPrediction(tweet: string, context: ScoringContext): { score: number, insights: string[] } {
  let score = 40 // Better base score
  const insights: string[] = []
  const lowerTweet = tweet.toLowerCase()
  
  // Question patterns (powerful engagement driver)
  const hasDirectQuestion = tweet.includes('?')
  const hasEngagementPhrase = WORD_PATTERNS.engagement.some(phrase => lowerTweet.includes(phrase))
  
  if (hasDirectQuestion && hasEngagementPhrase) {
    score += 25
    insights.push("Strong question format with direct engagement request")
  } else if (hasDirectQuestion) {
    score += 15
    insights.push("Direct question encourages responses")
  } else if (hasEngagementPhrase) {
    score += 12
    insights.push("Engagement-focused language present")
  }
  
  // Relatability and broad appeal
  const hasRelatable = WORD_PATTERNS.relatable.some(phrase => lowerTweet.includes(phrase))
  if (hasRelatable) {
    score += 15
    insights.push("Highly relatable content with universal appeal")
  }
  
  // Opinion and discussion triggers
  const opinionWords = ['think', 'believe', 'disagree', 'unpopular opinion', 'hot take', 'controversial']
  const hasOpinion = opinionWords.some(word => lowerTweet.includes(word))
  if (hasOpinion) {
    score += 12
    insights.push("Opinion-based content sparks discussion")
  }
  
  // Value proposition
  const valueCount = WORD_PATTERNS.valueWords.filter(word => lowerTweet.includes(word)).length
  if (valueCount >= 2) {
    score += 15
    insights.push("High-value content drives saves and shares")
  } else if (valueCount === 1) {
    score += 8
    insights.push("Provides value to audience")
  }
  
  // Storytelling elements
  const hasStory = WORD_PATTERNS.storytelling.some(word => lowerTweet.includes(word))
  if (hasStory) {
    score += 10
    insights.push("Storytelling elements increase engagement")
  }
  
  // Emotional hooks
  const emotionCount = WORD_PATTERNS.emotion.filter(word => lowerTweet.includes(word)).length
  if (emotionCount >= 2) {
    score += 12
    insights.push("Strong emotional language creates connection")
  } else if (emotionCount === 1) {
    score += 6
    insights.push("Emotional elements present")
  }
  
  // Context-specific optimization
  switch (context.contentMode) {
    case 'communityEngagement':
      if (hasDirectQuestion || hasEngagementPhrase) {
        score += 10
        insights.push("Optimized for community interaction")
      }
      break
    case 'thoughtLeadership':
      if (hasOpinion || valueCount > 0) {
        score += 10
        insights.push("Professional discussion catalyst")
      }
      break
    case 'personalBrand':
      if (WORD_PATTERNS.personal.some(word => lowerTweet.includes(word)) || hasStory) {
        score += 10
        insights.push("Personal brand building elements")
      }
      break
    case 'valueFirst':
      if (valueCount > 0) {
        score += 12
        insights.push("Value-first approach optimized")
      }
      break
  }
  
  // Mild penalties for engagement killers (less harsh)
  if (lowerTweet.includes('follow me') || lowerTweet.includes('subscribe')) {
    score -= 8
    insights.push("Self-promotional calls may reduce organic engagement")
  }
  
  // Length considerations for engagement
  if (tweet.length > 350) {
    score -= 5
    insights.push("Length may reduce engagement rate")
  } else if (tweet.length < 50) {
    score -= 5
    insights.push("May be too brief for meaningful engagement")
  }
  
  return { score: Math.min(100, Math.max(0, score)), insights }
}

// Quality signals scoring (25% of total score)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function scoreQualitySignals(tweet: string, context: ScoringContext): { score: number, insights: string[] } {
  let score = 60 // Good base score for quality
  const insights: string[] = []
  const words = tweet.split(/\s+/).filter(word => word.length > 0)
  
  // Basic quality checks
  if (/^[A-Z]/.test(tweet)) {
    score += 5
    insights.push("Proper capitalization")
  }
  
  // Readability optimization
  const avgWordLength = words.reduce((sum, word) => sum + word.replace(/[^\w]/g, '').length, 0) / words.length
  if (avgWordLength >= 3.5 && avgWordLength <= 6) {
    score += 10
    insights.push("Excellent readability balance")
  } else if (avgWordLength >= 3 && avgWordLength <= 7) {
    score += 5
    insights.push("Good readability")
  } else if (avgWordLength < 3) {
    score -= 5
    insights.push("Words may be too simple")
  } else {
    score -= 8
    insights.push("Complex words may reduce accessibility")
  }
  
  // Information density
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'for', 'with', 'on', 'at', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']
  const contentWords = words.filter(word => !stopWords.includes(word.toLowerCase()))
  const contentRatio = contentWords.length / words.length
  
  if (contentRatio >= 0.6) {
    score += 10
    insights.push("High information density")
  } else if (contentRatio >= 0.5) {
    score += 5
    insights.push("Good content-to-filler ratio")
  } else if (contentRatio < 0.4) {
    score -= 5
    insights.push("May contain too much filler")
  }
  
  // Specificity vs vagueness
  const specificWords = ['exactly', 'specifically', 'precisely', 'literally', 'actually', 'concrete', 'measurable', 'proven', 'data', 'research', 'study']
  const vagueWords = ['stuff', 'things', 'whatever', 'somehow', 'kinda', 'sorta', 'like', 'totally', 'basically']
  
  const hasSpecific = specificWords.some(word => tweet.toLowerCase().includes(word))
  const vagueCount = vagueWords.filter(word => tweet.toLowerCase().includes(word)).length
  
  if (hasSpecific && vagueCount === 0) {
    score += 12
    insights.push("Specific, clear communication")
  } else if (hasSpecific) {
    score += 6
    insights.push("Generally specific with some vague elements")
  } else if (vagueCount >= 2) {
    score -= 8
    insights.push("Vague language reduces clarity and impact")
  }
  
  // Sentence structure
  const sentences = tweet.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length >= 2 && sentences.length <= 4) {
    score += 8
    insights.push("Good sentence structure variety")
  } else if (sentences.length === 1 && tweet.length > 100) {
    score += 3
    insights.push("Single substantial sentence")
  }
  
  // Avoid clichés and overused phrases
  const cliches = ['game changer', 'think outside the box', 'low hanging fruit', 'circle back', 'at the end of the day', 'it is what it is', 'paradigm shift']
  const hasCliche = cliches.some(cliche => tweet.toLowerCase().includes(cliche))
  if (hasCliche) {
    score -= 10
    insights.push("Clichéd phrases reduce originality")
  }
  
  // Character efficiency
  if (tweet.length >= 80 && tweet.length <= 220) {
    score += 8
    insights.push("Optimal character usage")
  } else if (tweet.length >= 50 && tweet.length <= 280) {
    score += 4
    insights.push("Good content length")
  }
  
  return { score: Math.min(100, Math.max(0, score)), insights }
}

// Main scoring function with improved weighting
export function scoreTweetViralPotential(tweet: string, context: ScoringContext): ScoredTweet {
  const authenticity = scoreAuthenticity(tweet, context)
  const engagement = scoreEngagementPrediction(tweet, context)
  const quality = scoreQualitySignals(tweet, context)
  
  // Weighted calculation: 40% authenticity + 35% engagement + 25% quality
  const viralScore = Math.round(
    (authenticity.score * 0.40) + 
    (engagement.score * 0.35) + 
    (quality.score * 0.25)
  )
  
  // Compile insights with better categorization
  const allInsights = [
    ...authenticity.insights,
    ...engagement.insights,
    ...quality.insights
  ]
  
  // Improved insight categorization
  const strengths = allInsights.filter(insight => 
    insight.includes('excellent') || insight.includes('strong') || insight.includes('good') ||
    insight.includes('natural') || insight.includes('optimal') || insight.includes('authentic') ||
    insight.includes('high-value') || insight.includes('builds') || insight.includes('creates') ||
    insight.includes('enhances') || insight.includes('drives')
  )
  
  const improvements = allInsights.filter(insight => 
    insight.includes('reduce') || insight.includes('may') || insight.includes('too') ||
    insight.includes('lacks') || insight.includes('overly') || insight.includes('excessive')
  )
  
  // More nuanced reasoning
  let reasoning = ''
  if (viralScore >= 85) {
    reasoning = 'Exceptional viral potential with strong performance across all metrics'
  } else if (viralScore >= 75) {
    reasoning = 'High viral potential with excellent fundamentals'
  } else if (viralScore >= 65) {
    reasoning = 'Good viral potential with solid engagement drivers'
  } else if (viralScore >= 55) {
    reasoning = 'Moderate potential with room for optimization'
  } else if (viralScore >= 45) {
    reasoning = 'Below average potential, needs improvement'
  } else {
    reasoning = 'Low viral potential, significant revisions recommended'
  }
  
  return {
    content: tweet,
    viralScore,
    scores: {
      authenticity: authenticity.score,
      engagementPrediction: engagement.score,
      qualitySignals: quality.score
    },
    insights: {
      strengths,
      improvements,
      reasoning
    }
  }
}

// Generate multiple tweets and return best scoring ones
export function rankTweetsByViralPotential(tweets: string[], context: ScoringContext): ScoredTweet[] {
  return tweets
    .map(tweet => scoreTweetViralPotential(tweet, context))
    .sort((a, b) => b.viralScore - a.viralScore)
} 