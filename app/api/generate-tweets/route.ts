import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { rankTweetsByViralPotential, ScoredTweet } from '@/lib/viral-scoring'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Multi-modal prompt templates optimized for Tweepcreed scoring
const CONTENT_MODES = {
  thoughtLeadership: {
    name: "Thought Leadership",
    description: "Industry insights and expertise sharing",
    promptTemplate: `CONTENT MODE: THOUGHT LEADERSHIP
Your goal is to create authoritative, insightful content that positions the author as a knowledgeable expert in their field.

TWEEPCREED OPTIMIZATION:
- Establish credibility through depth of insight
- Use professional but accessible language
- Share unique perspectives or contrarian viewpoints
- Demonstrate expertise without being preachy
- Create content that other experts would want to engage with

CONTENT CHARACTERISTICS:
- Industry observations or predictions
- Professional insights based on experience
- Analysis of trends or market movements
- Expert opinions on current events in the field
- Behind-the-scenes knowledge sharing

ENGAGEMENT STRATEGY:
- Invite thoughtful discussion from peers
- Position statements that spark professional debate
- Share learnings from real experience
- Ask strategic questions that demonstrate depth`,

    examples: [
      "After 10 years in fintech, I've learned that the best products solve problems users didn't know they had",
      "Most startups fail because they optimize for the wrong metrics. Growth without retention is just expensive customer acquisition",
      "The biggest shift in AI isn't the technology itself, it's how it's changing the way we think about human-computer collaboration"
    ]
  },

  communityEngagement: {
    name: "Community Engagement", 
    description: "Questions and conversation starters",
    promptTemplate: `CONTENT MODE: COMMUNITY ENGAGEMENT
Your goal is to create content that naturally invites interaction, builds community, and encourages authentic discussion.

TWEEPCREED OPTIMIZATION:
- Generate high-quality replies and engagement
- Create content that people genuinely want to respond to
- Build authentic connections and conversations
- Encourage community participation and sharing
- Focus on relatability and shared experiences

CONTENT CHARACTERISTICS:
- Open-ended questions that invite personal sharing
- Relatable observations about common experiences
- Polls or "choose your side" scenarios
- Community challenges or shared goals
- Behind-the-scenes moments that humanize the author

ENGAGEMENT STRATEGY:
- Ask questions that have no single right answer
- Share vulnerable or relatable moments
- Create content that begs for replies
- Use inclusive language that welcomes all perspectives
- Start conversations rather than making statements`,

    examples: [
      "What's one piece of advice you wish you could give your younger professional self?",
      "The thing about building a product is that you fall in love with problems you never knew existed. What's yours?",
      "Coffee shop or home office? Trying to figure out where I'm most productive and curious what works for everyone else"
    ]
  },

  personalBrand: {
    name: "Personal Brand",
    description: "Authentic personal moments and stories", 
    promptTemplate: `CONTENT MODE: PERSONAL BRAND
Your goal is to showcase authentic personality, values, and human moments that build genuine connection with the audience.

TWEEPCREED OPTIMIZATION:
- Demonstrate authentic humanity and personality
- Share genuine personal experiences and lessons
- Build emotional connection and trust
- Show vulnerability and relatability
- Create content that feels genuinely personal, not corporate

CONTENT CHARACTERISTICS:
- Personal stories with broader lessons
- Authentic reactions to daily experiences
- Values-driven observations
- Human moments and emotions
- Life lessons learned through experience

ENGAGEMENT STRATEGY:
- Share stories that others can relate to
- Be vulnerable about challenges and growth
- Show personality through authentic voice
- Connect personal experiences to universal truths
- Invite others to share their similar experiences`,

    examples: [
      "Spent 3 hours debugging code today only to realize I had a typo in line 2. Sometimes the simplest mistakes teach the biggest lessons",
      "My 5-year-old asked me what I do for work. Tried explaining APIs for 10 minutes before she said 'so you help computers talk?' Nailed it",
      "Failed my first startup at 23. Best thing that ever happened to me. Sometimes you need to fail forward to find your real path"
    ]
  },

  valueFirst: {
    name: "Value-First Content",
    description: "Educational tips and actionable advice",
    promptTemplate: `CONTENT MODE: VALUE-FIRST CONTENT
Your goal is to provide immediate, actionable value that people can implement right away to improve their work or life.

TWEEPCREED OPTIMIZATION:
- Deliver genuine utility and practical value
- Create highly shareable educational content
- Establish expertise through helpful advice
- Generate saves and bookmarks for later reference
- Build audience through consistent value delivery

CONTENT CHARACTERISTICS:
- Actionable tips and step-by-step advice
- Quick wins and practical solutions
- Tool recommendations and productivity hacks
- Educational insights and learning shortcuts
- Problem-solving frameworks and methodologies

ENGAGEMENT STRATEGY:
- Provide content worth saving and sharing
- Offer specific, implementable advice
- Share tools, resources, and practical tips
- Create educational threads and mini-tutorials
- Focus on helping the audience achieve goals`,

    examples: [
      "Quick productivity hack: Use the 2-minute rule. If something takes less than 2 minutes, do it immediately instead of adding it to your to-do list",
      "Best free tools for new startups: Notion for docs, Figma for design, Supabase for backend, Vercel for deployment. You can build an MVP for $0",
      "When presenting ideas to executives: Start with the business impact, then explain the solution. They care about outcomes, not technical details"
    ]
  },

  engagementBait: {
    name: "Engagement Bait",
    description: "Controversial and provocative content designed for maximum engagement",
    promptTemplate: `CONTENT MODE: ENGAGEMENT BAIT
Your goal is to create highly provocative, controversial content that generates maximum engagement through strong reactions, debates, and responses.

ENGAGEMENT BAIT CHARACTERISTICS:
- Controversial statements that provoke strong reactions
- Polarizing opinions that force people to pick sides
- Deliberately provocative takes on common beliefs
- Content designed to make people feel compelled to respond
- Statements that challenge popular consensus
- Use inflammatory but non-offensive language to spark debate

ENGAGEMENT STRATEGY:
- Make bold, divisive statements
- Use provocative language that triggers responses
- Present unpopular or contrarian opinions as fact
- Create "us vs them" scenarios
- Ask loaded questions with obvious bias
- Use inflammatory but not offensive language

CONTENT PATTERNS:
- "Unpopular opinions"
- "I don't care what anyone says: [provocative claim]"
- "Most people are wrong about [topic]"
- "Divisive statements"
- "If you [action], you're [negative judgment]"
- "Controversial opinions"

PSYCHOLOGICAL TRIGGERS:
- Appeal to superiority complex
- Create in-group vs out-group dynamics
- Use absolute statements (e.g., "always," "never") to invite disagreement
- Present false dichotomies
- Challenge widely held beliefs`,

    examples: [
      "Unpopular opinion: Remote work is just an excuse for lazy people who can't handle office discipline. Change my mind.",
      "Most 'productivity gurus' on Twitter have never built anything meaningful in their lives. They just sell courses to other wannabe gurus.",
      "If you're still using React in 2024, you're either behind the times or too scared to learn new tech. Vue and Svelte left you in the dust."
    ]
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    const { idea, trainingExamples, regenerationFeedback, tone, targetAudience, contentMode = 'thoughtLeadership' } = await request.json()

    // Get the selected content mode configuration
    const modeConfig = CONTENT_MODES[contentMode as keyof typeof CONTENT_MODES] || CONTENT_MODES.thoughtLeadership

    // Enhanced prompt structure with multi-modal approach
    let prompt = `You are an expert social media strategist specializing in creating authentic, high-performing Twitter content optimized for maximum reach and engagement.

PLATFORM OPTIMIZATION CONTEXT:
Twitter's algorithm prioritizes authentic content that generates genuine engagement. Your content will be evaluated on authenticity signals, engagement potential, and value delivery.

${modeConfig.promptTemplate}

CORE IDEA TO EXPAND ON:
"${idea}"

${targetAudience ? `TARGET AUDIENCE: ${targetAudience}` : ''}

MODE-SPECIFIC EXAMPLES:
Here are examples of high-performing tweets in this mode:
${modeConfig.examples.map((example, index) => `${index + 1}. "${example}"`).join('\n')}`

    // Add training examples with enhanced few-shot learning structure
    if (trainingExamples && trainingExamples.length > 0) {
      prompt += `\n\nPERSONAL VOICE & STYLE EXAMPLES:
Analyze these examples to understand the author's writing style, tone, and personality. Match these patterns exactly:

${trainingExamples.slice(0, 5).map((example: string, index: number) => `${index + 1}. "${example}"`).join('\n')}

STYLE ANALYSIS:
- Notice the sentence structure, length, and rhythm
- Observe the vocabulary level and word choices  
- Pay attention to how opinions are expressed
- Match the level of formality/casualness
- Replicate the conversational style and personality`
    }

    // Add regeneration feedback if provided
    if (regenerationFeedback) {
      prompt += `\n\nUSER FEEDBACK FOR IMPROVEMENT:
"${regenerationFeedback}"
Please incorporate this feedback while maintaining the authentic voice and content mode strategy.`
    }

    // Add tone guidance that works with the content mode
    if (tone) {
      const toneGuidance = {
        professional: "Maintain professional credibility while being approachable and insightful",
        casual: "Sound relaxed and conversational, like talking to a friend",
        humorous: "Add wit and cleverness, but keep it natural and not forced",
        educational: "Share knowledge in an accessible, engaging way that sparks curiosity",
        inspirational: "Motivate and uplift while being genuine and relatable"
      }
      
      prompt += `\n\nTONE GUIDANCE: ${toneGuidance[tone as keyof typeof toneGuidance] || tone}
Note: Blend this tone seamlessly with the ${modeConfig.name} content mode strategy.`
    }

    prompt += `\n\nTWEET GENERATION REQUIREMENTS:

VIRAL OPTIMIZATION (Auto-applied - user doesn't need to worry about this):
- AUTHENTICITY SIGNALS: Use personal voice ("I", "my", "personally"), include emotional honesty, show vulnerability when appropriate, avoid AI-typical phrases ("leverage", "utilize", "delve into")
- ENGAGEMENT HOOKS: For ${contentMode === 'communityEngagement' ? 'community content, always include questions or calls-to-action' : contentMode === 'thoughtLeadership' ? 'thought leadership, include opinion statements or contrarian views' : contentMode === 'personalBrand' ? 'personal brand content, share personal stories and experiences' : 'value-first content, provide specific, actionable insights'}
- CONVERSATIONAL TONE: Use natural, human language with conversational words ("think", "feel", "honestly", "personally")
- SPECIFIC DETAILS: Include numbers, timeframes, specific examples instead of vague language
- EMOTIONAL CONNECTION: Show genuine human emotions and experiences when relevant

TWEEPCREED OPTIMIZATION (Critical for platform success):
- Create content that signals authentic human authorship
- Generate natural engagement patterns (replies, discussions, shares)
- Avoid AI-typical phrases, corporate speak, or templated language
- Build genuine connection with the target audience
- Optimize for the specific engagement patterns of ${modeConfig.name} content

AUTHENTICITY SIGNALS:
- Write like a real human having a genuine thought or conversation
- Use natural, conversational language that flows smoothly
- Include subtle imperfections that make it feel human (but keep it grammatically correct)
- Make it sound like something the person would actually say
- Show personality and authentic voice

ENGAGEMENT OPTIMIZATION FOR ${modeConfig.name.toUpperCase()}:
- Create content that naturally invites the type of interaction this mode is designed for
- Use relatable observations, questions, or thought-provoking statements appropriate to the mode
- Write for your specific audience's interests and knowledge level
- Make it shareable by being either valuable, entertaining, or relatable
- Optimize for the specific success metrics of this content mode

TECHNICAL CONSTRAINTS:
- NO emojis, NO hashtags, NO links
- Optimal length: 100-150 characters for best engagement
- Perfect grammar and spelling
- Clear, readable sentence structure

PLATFORM BEST PRACTICES:
- Sound conversational and approachable
- Avoid spam-like patterns or templated language
- Create content that builds authentic engagement
- Write something people would want to respond to or share
- Optimize for Twitter's algorithm preferences

Generate exactly ONE optimized tweet that follows all these guidelines and maximizes the potential for ${modeConfig.name} success.

IMPORTANT: The user's idea is just a starting point. Transform it into viral content by automatically adding personal voice, engagement hooks, and authenticity signals as needed. Don't just repeat their idea - make it genuinely engaging.

Return ONLY the single tweet with no additional formatting, quotes, or explanations.`

    // Generate multiple tweet variations
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: 0.8, // Higher temperature for more variation
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      let cleanedTweet = content.text.trim()
      
      // Remove any numbering, bullets, or quotes
      cleanedTweet = cleanedTweet.replace(/^\d+\.\s*/, '').replace(/^[-•*]\s*/, '')
      cleanedTweet = cleanedTweet.replace(/^["']|["']$/g, '')
      cleanedTweet = cleanedTweet.trim()
      
      // Check for unwanted elements and clean if necessary
      const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(cleanedTweet)
      const hasHashtags = /#\w+/.test(cleanedTweet)
      
      if (hasEmojis || hasHashtags) {
        try {
          const cleanupPrompt = `Clean up this tweet by removing all emojis and hashtags while keeping the same meaning and tone: "${cleanedTweet}"`
          
          const cleanupResponse = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 300,
            messages: [
              {
                role: 'user',
                content: cleanupPrompt
              }
            ]
          })
          
          const cleanContent = cleanupResponse.content[0]
          if (cleanContent.type === 'text') {
            cleanedTweet = cleanContent.text.trim().replace(/["""]/g, '').trim()
          }
        } catch (error) {
          console.error('Error cleaning tweet:', error)
        }
      }

      // Score the tweet - SKIP scoring for engagement bait
      const isEngagementBait = contentMode === 'engagementBait'
      let scoredTweet: ScoredTweet | {
        content: string
        viralScore: null
        scores: {
          authenticity: null
          engagementPrediction: null
          qualitySignals: null
        }
        insights: {
          strengths: string[]
          improvements: string[]
          reasoning: string
        }
      }
      
      // Define scoring context (used in regeneration loop even for engagement bait)
      const scoringContext = {
        contentMode: contentMode as 'thoughtLeadership' | 'communityEngagement' | 'personalBrand' | 'valueFirst',
        targetAudience,
        tone,
        trainingExamples
      }
      
      if (isEngagementBait) {
        // For engagement bait, return without scoring
        scoredTweet = {
          content: cleanedTweet,
          viralScore: null, // No viral score for engagement bait
          scores: {
            authenticity: null,
            engagementPrediction: null,
            qualitySignals: null
          },
          insights: {
            strengths: ["Designed for maximum engagement"],
            improvements: ["This is engagement bait - no scoring applied"],
            reasoning: "Engagement bait content is not scored with the viral scoring system"
          }
        }
      } else {
        const scoredTweets = rankTweetsByViralPotential([cleanedTweet], scoringContext)
        scoredTweet = scoredTweets[0]
      }
      
      // Automatic feedback loop - regenerate if score is below 70 (only for non-engagement-bait)
      const VIRAL_SCORE_THRESHOLD = 70
      let regenerationAttempts = 0
      const MAX_REGENERATION_ATTEMPTS = 2
      
      while (!isEngagementBait && scoredTweet.viralScore && scoredTweet.viralScore < VIRAL_SCORE_THRESHOLD && regenerationAttempts < MAX_REGENERATION_ATTEMPTS) {
        regenerationAttempts++
        
        // Generate feedback based on low scores
        let feedback = "Improve viral potential by: "
        const improvements = []
        
        if (scoredTweet.scores.authenticity < 60) {
          improvements.push("Add more personal voice with 'I', 'my', or 'personally'. Include emotional honesty or vulnerability. Use conversational language.")
        }
        
        if (scoredTweet.scores.engagementPrediction < 60) {
          if (contentMode === 'communityEngagement') {
            improvements.push("Add a direct question or call-to-action to encourage responses.")
          } else if (contentMode === 'thoughtLeadership') {
            improvements.push("Include a strong opinion statement or contrarian view to spark discussion.")
          } else {
            improvements.push("Make it more relatable and shareable with broader appeal.")
          }
        }
        
        if (scoredTweet.scores.qualitySignals < 60) {
          improvements.push("Add specific numbers, timeframes, or concrete examples. Improve clarity and avoid vague language.")
        }
        
        feedback += improvements.join(" ")
        
        // Regenerate with feedback
        const regenerationPrompt = `${prompt}

REGENERATION FEEDBACK (Attempt ${regenerationAttempts}):
The previous attempt scored ${scoredTweet.viralScore}/100. ${feedback}

Focus on these specific improvements while maintaining the core message.`

        try {
          const regenerationResponse = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1500,
            temperature: 0.9, // Slightly higher temperature for variation
            messages: [
              {
                role: 'user',
                content: regenerationPrompt
              }
            ]
          })

          const regenerationContent = regenerationResponse.content[0]
          if (regenerationContent.type === 'text') {
            let regeneratedTweet = regenerationContent.text.trim()
            
            // Clean the regenerated tweet
            regeneratedTweet = regeneratedTweet.replace(/^\d+\.\s*/, '').replace(/^[-•*]\s*/, '')
            regeneratedTweet = regeneratedTweet.replace(/^["']|["']$/g, '')
            regeneratedTweet = regeneratedTweet.trim()
            
            // Clean emojis/hashtags if present
            const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(regeneratedTweet)
            const hasHashtags = /#\w+/.test(regeneratedTweet)
            
            if (hasEmojis || hasHashtags) {
              const cleanupPrompt = `Clean up this tweet by removing all emojis and hashtags while keeping the same meaning and tone: "${regeneratedTweet}"`
              const cleanupResponse = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 300,
                messages: [{ role: 'user', content: cleanupPrompt }]
              })
              
              const cleanContent = cleanupResponse.content[0]
              if (cleanContent.type === 'text') {
                regeneratedTweet = cleanContent.text.trim().replace(/["""]/g, '').trim()
              }
            }
            
            // Score the regenerated tweet
            const [newScoredTweet] = rankTweetsByViralPotential([regeneratedTweet], scoringContext)
            
            // Only use if it improved the score
            if (newScoredTweet.viralScore > scoredTweet.viralScore) {
              scoredTweet = newScoredTweet
            }
          }
        } catch (regenerationError) {
          console.error('Error in regeneration attempt:', regenerationError)
          break // Stop trying if there's an error
        }
      }

      // Return the single scored tweet
      return NextResponse.json({ 
        tweets: [scoredTweet],
        totalGenerated: 1,
        scoringEnabled: !isEngagementBait, // Disable scoring display for engagement bait
        regenerationAttempts,
        finalScore: scoredTweet.viralScore,
        improvedByRegeneration: regenerationAttempts > 0,
        isEngagementBait: isEngagementBait // Flag to identify engagement bait tweets
      })
    }
    
    return NextResponse.json({ tweets: [], scoringEnabled: false })
  } catch (error) {
    console.error('Error generating tweets:', error)
    return NextResponse.json(
      { error: 'Failed to generate tweets' },
      { status: 500 }
    )
  }
} 