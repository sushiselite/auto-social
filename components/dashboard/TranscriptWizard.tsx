'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { ExtractedInsight } from '@/app/api/extract-insights/route'
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Check, 
  X, 
  Edit3,
  Eye,
  EyeOff
} from 'lucide-react'
import { ButtonLoading } from '@/components/ui/LoadingSpinner'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface TranscriptWizardProps {
  onComplete: () => void
  onCancel: () => void
}

interface Insight extends ExtractedInsight {
  id: string
  isSelected: boolean
  isEditing: boolean
  originalContent: string
}

interface GeneratedTweetData {
  tweet: {
    content: string
    viralScore: number
    scores: {
      authenticity: number
      engagementPrediction: number
      qualitySignals: number
    }
  }
  insightId: string
}

type WizardStep = 'input' | 'insights' | 'generation' | 'complete'

const CONTENT_TYPES = [
  { value: 'coaching_call', label: 'Coaching Call', icon: '🎯' },
  { value: 'interview', label: 'Interview', icon: '🎤' },
  { value: 'webinar', label: 'Webinar', icon: '📚' },
  { value: 'meeting', label: 'Meeting', icon: '🤝' },
  { value: 'presentation', label: 'Presentation', icon: '📊' },
  { value: 'general', label: 'General Content', icon: '📝' }
]

const CONTENT_MODES = [
  { value: 'thoughtLeadership', label: 'Thought Leadership', icon: '🎯' },
  { value: 'communityEngagement', label: 'Community Engagement', icon: '💬' },
  { value: 'personalBrand', label: 'Personal Brand', icon: '✨' },
  { value: 'valueFirst', label: 'Value First', icon: '🎁' },
  { value: 'engagementBait', label: 'Engagement Bait', icon: '🔥' }
]

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'humorous', label: 'Humorous' },
  { value: 'educational', label: 'Educational' },
  { value: 'inspirational', label: 'Inspirational' }
]

export const TranscriptWizard: React.FC<TranscriptWizardProps> = ({ onComplete, onCancel }) => {
  const { user } = useAuth()
  
  // Step 1: Input
  const [currentStep, setCurrentStep] = useState<WizardStep>('input')
  const [title, setTitle] = useState('')
  const [transcript, setTranscript] = useState('')
  const [contentType, setContentType] = useState('general')
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Step 2: Insights
  const [insights, setInsights] = useState<Insight[]>([])
  const [contentSummary, setContentSummary] = useState('')
  
  // Step 3: Generation
  const [contentMode, setContentMode] = useState('thoughtLeadership')
  const [tone, setTone] = useState('professional')
  const [targetAudience, setTargetAudience] = useState('')
  const [isGeneratingTweets, setIsGeneratingTweets] = useState(false)
  const [generatedTweets, setGeneratedTweets] = useState<GeneratedTweetData[]>([])
  
  // Step 4: Complete
  const [savedTranscriptId, setSavedTranscriptId] = useState<string | null>(null)

  const handleExtractInsights = async () => {
    if (!transcript.trim() || transcript.length < 500) {
      toast.error('Transcript must be at least 500 characters long')
      return
    }

    if (transcript.length > 50000) {
      toast.error('Transcript must be less than 50,000 characters')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/extract-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, contentType })
      })

      if (!response.ok) {
        throw new Error('Failed to extract insights')
      }

      const data = await response.json()
      
      // Convert to insights with additional UI state
      const processedInsights: Insight[] = data.insights.map((insight: ExtractedInsight, index: number) => ({
        ...insight,
        id: `insight-${index}`,
        isSelected: true,
        isEditing: false,
        originalContent: insight.content
      }))

      setInsights(processedInsights)
      setContentSummary(data.content_summary)
      setCurrentStep('insights')
      toast.success(`Extracted ${data.total_extracted} insights from your transcript`)
    } catch (error) {
      console.error('Error extracting insights:', error)
      toast.error('Failed to extract insights. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleInsight = (insightId: string) => {
    setInsights(prev => 
      prev.map(insight => 
        insight.id === insightId 
          ? { ...insight, isSelected: !insight.isSelected }
          : insight
      )
    )
  }

  const handleEditInsight = (insightId: string) => {
    setInsights(prev => 
      prev.map(insight => 
        insight.id === insightId 
          ? { ...insight, isEditing: true }
          : { ...insight, isEditing: false }
      )
    )
  }

  const handleSaveInsight = (insightId: string, newContent: string) => {
    setInsights(prev => 
      prev.map(insight => 
        insight.id === insightId 
          ? { ...insight, content: newContent, isEditing: false }
          : insight
      )
    )
  }

  const handleCancelEdit = (insightId: string) => {
    setInsights(prev => 
      prev.map(insight => 
        insight.id === insightId 
          ? { ...insight, content: insight.originalContent, isEditing: false }
          : insight
      )
    )
  }

  const handleGenerateTweets = async () => {
    console.log('🚀 Starting tweet generation...')
    const selectedInsights = insights.filter(insight => insight.isSelected)
    console.log('📝 Selected insights:', selectedInsights.length, selectedInsights)
    
    if (selectedInsights.length === 0) {
      toast.error('Please select at least one insight to generate tweets')
      return
    }

    setIsGeneratingTweets(true)
    try {
      console.log('👤 User:', user)
      // User exists in auth.users automatically via Supabase auth
      console.log('✅ User authenticated, proceeding with transcript save')

      console.log('💾 Saving transcript to database...')
      // First, save the transcript
      console.log('📝 Transcript data to save:', {
        user_id: user?.id,
        title: title || 'Untitled Transcript',
        content_type: contentType,
        character_count: transcript.length,
        status: 'processing'
      })

      // Validate constraints before insert
      if (transcript.length < 500 || transcript.length > 50000) {
        throw new Error(`Character count ${transcript.length} violates constraint (must be 500-50000)`)
      }

      console.log('✅ Character count validation passed')
      
      // Skip auth test and go directly to insert - the issue is RLS policy, not auth
      console.log('🚀 Attempting direct insert (RLS policy should be fixed)...')
      try {
        const { data: transcriptData, error: transcriptError } = await supabase
          .from('transcripts')
          .insert({
            user_id: user?.id,
            title: title || 'Untitled Transcript',
            content: transcript,
            content_type: contentType,
            character_count: transcript.length,
            status: 'processing'
          })
          .select()
          .single()

        console.log('📥 Direct insert result:', { data: transcriptData, error: transcriptError })

        if (transcriptError) {
          console.error('❌ Direct insert error details:', {
            message: transcriptError.message,
            details: transcriptError.details,
            hint: transcriptError.hint,
            code: transcriptError.code
          })
          throw transcriptError
        }

        console.log('✅ Transcript saved successfully:', transcriptData.id)
        setSavedTranscriptId(transcriptData.id)

        console.log('💡 Saving insights to database...')
        // Save insights to database
        const insightRows = selectedInsights.map((insight, index) => ({
          transcript_id: transcriptData.id,
          user_id: user?.id,
          content: insight.content,
          speaker_attribution: insight.speaker_attribution,
          insight_type: insight.insight_type,
          order_index: index,
          is_selected: true
        }))

        const { data: savedInsights, error: insightsError } = await supabase
          .from('insights')
          .insert(insightRows)
          .select()

        if (insightsError) {
          console.error('❌ Insights save error:', insightsError)
          throw insightsError
        }
        console.log('✅ Insights saved:', savedInsights.length, savedInsights)

        console.log('📚 Fetching training examples...')
        // Get user's training examples
        const { data: trainingData } = await supabase
          .from('training_examples')
          .select('tweet_text')
          .eq('user_id', user?.id)

        const trainingExamples = trainingData?.map(example => example.tweet_text) || []
        console.log('📚 Training examples found:', trainingExamples.length)

        console.log('🤖 Calling tweet generation API...')
        console.log('📤 API payload:', {
          insights: savedInsights.map(insight => ({
            id: insight.id,
            content: insight.content,
            insight_type: insight.insight_type,
            speaker_attribution: insight.speaker_attribution
          })),
          contentMode,
          tone,
          targetAudience: targetAudience.trim() || undefined,
          trainingExamples
        })

        // Generate tweets from insights
        const response = await fetch('/api/generate-tweets-from-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            insights: savedInsights.map(insight => ({
              id: insight.id,
              content: insight.content,
              insight_type: insight.insight_type,
              speaker_attribution: insight.speaker_attribution
            })),
            contentMode,
            tone,
            targetAudience: targetAudience.trim() || undefined,
            trainingExamples
          })
        })

        console.log('📥 API response status:', response.status)
        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ API error response:', errorText)
          throw new Error(`Failed to generate tweets: ${response.status} ${errorText}`)
        }

        const tweetData = await response.json()
        console.log('✅ Generated tweet data:', tweetData)

        // Save tweets to database
        const tweetsToInsert = tweetData.tweets.map((tweetWithInsight: GeneratedTweetData) => ({
          user_id: user?.id,
          transcript_id: transcriptData.id,
          insight_id: tweetWithInsight.insightId,
          content: tweetWithInsight.tweet.content,
          status: 'generated',
          viral_score: tweetWithInsight.tweet.viralScore,
          authenticity_score: tweetWithInsight.tweet.scores.authenticity,
          engagement_score: tweetWithInsight.tweet.scores.engagementPrediction,
          quality_score: tweetWithInsight.tweet.scores.qualitySignals
        }))

        const { error: tweetsError } = await supabase
          .from('tweets')
          .insert(tweetsToInsert)

        if (tweetsError) throw tweetsError

        // Update transcript status
        await supabase
          .from('transcripts')
          .update({ status: 'completed' })
          .eq('id', transcriptData.id)

        setGeneratedTweets(tweetData.tweets)
        setCurrentStep('complete')
        
        if (tweetData.scoringEnabled) {
          const avgScore = Math.round(
            tweetData.tweets.reduce((sum: number, tweet: GeneratedTweetData) => sum + tweet.tweet.viralScore, 0) / tweetData.tweets.length
          )
          toast.success(`Generated ${tweetData.tweets.length} tweets! Average viral score: ${avgScore}/100 ✨`)
        } else {
          toast.success(`Generated ${tweetData.tweets.length} tweets from your insights! ✨`)
        }
        
      } catch (error) {
        console.error('Error generating tweets:', error)
        toast.error('Failed to generate tweets. Please try again.')
        
        // Update transcript status to failed if we saved it
        if (savedTranscriptId) {
          await supabase
            .from('transcripts')
            .update({ status: 'failed' })
            .eq('id', savedTranscriptId)
        }
      } finally {
        setIsGeneratingTweets(false)
      }
    } catch (error) {
      console.error('Error generating tweets:', error)
      toast.error('Failed to generate tweets. Please try again.')
      
      // Update transcript status to failed if we saved it
      if (savedTranscriptId) {
        await supabase
          .from('transcripts')
          .update({ status: 'failed' })
          .eq('id', savedTranscriptId)
      }
    }
  }

  const renderStepIndicator = () => {
    const steps = ['input', 'insights', 'generation', 'complete'] as const
    const currentIndex = steps.indexOf(currentStep)

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              index <= currentIndex 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-400'
            )}>
              {index < currentIndex ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                'w-16 h-0.5 mx-2',
                index < currentIndex ? 'bg-indigo-600' : 'bg-gray-200'
              )} />
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderInputStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Input Your Transcript</h2>
        <p className="text-gray-600">Paste your transcript or long-form content to extract key insights</p>
      </div>

      <div className="form-group">
        <label className="form-label">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your transcript a descriptive title..."
          className="input-field"
          maxLength={255}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Content Type</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CONTENT_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setContentType(type.value)}
              className={cn(
                'p-3 rounded-lg border text-left transition-all duration-200',
                contentType === type.value
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{type.icon}</span>
                <span className="font-medium text-sm">{type.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          Transcript Content
          <span className="text-gray-400 font-normal">(500-50,000 characters)</span>
        </label>
        <div className="relative">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste your transcript here... Include speaker names if available (e.g., 'John: This is an important point about...')"
            className="input-field resize-none"
            rows={12}
            minLength={500}
            maxLength={50000}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            {transcript.length.toLocaleString()}/50,000
          </div>
        </div>
        {transcript.length > 0 && transcript.length < 500 && (
          <p className="text-xs text-orange-600 mt-1">
            Minimum 500 characters required ({500 - transcript.length} more needed)
          </p>
        )}
        {transcript.length >= 500 && (
          <p className="text-xs text-green-600 mt-1">
            ✓ Ready for insight extraction
          </p>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={onCancel} className="btn-secondary px-6 py-3">
          <X className="h-4 w-4" />
          Cancel
        </button>
        <ButtonLoading
          onClick={handleExtractInsights}
          loading={isProcessing}
          loadingText="Extracting insights..."
          disabled={!transcript.trim() || transcript.length < 500 || !title.trim()}
          className="btn-primary px-6 py-3"
        >
          <Sparkles className="h-4 w-4" />
          Extract Insights
        </ButtonLoading>
      </div>
    </div>
  )

  const renderInsightsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Edit Insights</h2>
        <p className="text-gray-600">Select which insights to convert to tweets and edit them if needed</p>
      </div>

      {contentSummary && (
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">Content Summary</h3>
          <p className="text-blue-800 text-sm">{contentSummary}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">
            Extracted Insights ({insights.filter(i => i.isSelected).length} selected)
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setInsights(prev => prev.map(i => ({ ...i, isSelected: true })))}
              className="btn-secondary btn-sm px-4 py-2"
            >
              Select All
            </button>
            <button
              onClick={() => setInsights(prev => prev.map(i => ({ ...i, isSelected: false })))}
              className="btn-secondary btn-sm px-4 py-2"
            >
              Deselect All
            </button>
          </div>
        </div>

        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onToggle={() => handleToggleInsight(insight.id)}
            onEdit={() => handleEditInsight(insight.id)}
            onSave={(content) => handleSaveInsight(insight.id, content)}
            onCancelEdit={() => handleCancelEdit(insight.id)}
          />
        ))}
      </div>

      <div className="flex justify-between">
        <button 
          onClick={() => setCurrentStep('input')} 
          className="btn-secondary px-6 py-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={() => setCurrentStep('generation')}
          disabled={insights.filter(i => i.isSelected).length === 0}
          className="btn-primary px-6 py-3"
        >
          Continue to Generation
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  const renderGenerationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate Tweets</h2>
        <p className="text-gray-600">Configure how your insights should be transformed into tweets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-group">
          <label className="form-label">Content Mode</label>
          <div className="space-y-2">
            {CONTENT_MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => setContentMode(mode.value)}
                className={cn(
                  'w-full p-3 rounded-lg border text-left transition-all duration-200',
                  contentMode === mode.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{mode.icon}</span>
                  <span className="font-medium">{mode.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="form-group">
            <label className="form-label">Tone & Style</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="input-field"
            >
              {TONES.map((toneOption) => (
                <option key={toneOption.value} value={toneOption.value}>
                  {toneOption.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Target Audience <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Describe your target audience... e.g. 'Tech entrepreneurs and startup founders'"
              className="input-field resize-none"
              rows={3}
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-1">
              {targetAudience.length}/200 characters
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-yellow-50 border-yellow-200">
        <h3 className="font-medium text-yellow-900 mb-2">Preview Selected Insights</h3>
        <div className="space-y-2">
          {insights.filter(i => i.isSelected).map((insight, index) => (
            <div key={insight.id} className="text-sm text-yellow-800">
              <span className="font-medium">{index + 1}.</span> {insight.content}
              {insight.speaker_attribution && (
                <span className="text-yellow-600 ml-2">({insight.speaker_attribution})</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button 
          onClick={() => setCurrentStep('insights')} 
          className="btn-secondary px-6 py-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <ButtonLoading
          onClick={handleGenerateTweets}
          loading={isGeneratingTweets}
          loadingText="Generating tweets..."
          className="btn-primary btn-lg px-8 py-4"
        >
          <Sparkles className="h-4 w-4" />
          Generate Tweets
        </ButtonLoading>
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tweets Generated Successfully!</h2>
        <p className="text-gray-600">Your insights have been transformed into engaging tweets</p>
      </div>

      <div className="card">
        <h3 className="font-medium text-gray-900 mb-4">Generated Tweets Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-indigo-600">{generatedTweets.length}</div>
            <div className="text-sm text-gray-600">Tweets Created</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {insights.filter(i => i.isSelected).length}
            </div>
            <div className="text-sm text-gray-600">Insights Used</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(generatedTweets.reduce((sum, tweet) => sum + (tweet.tweet.viralScore || 0), 0) / generatedTweets.length) || 0}
            </div>
            <div className="text-sm text-gray-600">Avg Viral Score</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{transcript.length.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Characters Processed</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">Your Generated Tweets</h3>
        {generatedTweets.map((tweetData, index) => (
          <div key={index} className="card border-l-4 border-l-indigo-500">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-gray-600">Tweet {index + 1}</span>
              {tweetData.tweet.viralScore && (
                <span className="text-sm text-indigo-600 font-medium">
                  {tweetData.tweet.viralScore}/100 viral score
                </span>
              )}
            </div>
            <p className="text-gray-900 mb-2">{tweetData.tweet.content}</p>
            <div className="text-xs text-gray-500">
              {tweetData.tweet.content.length} characters
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <button onClick={onComplete} className="btn-primary btn-lg">
          <Check className="h-4 w-4" />
          Complete & View Dashboard
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      {renderStepIndicator()}
      
      <div className="card">
        {currentStep === 'input' && renderInputStep()}
        {currentStep === 'insights' && renderInsightsStep()}
        {currentStep === 'generation' && renderGenerationStep()}
        {currentStep === 'complete' && renderCompleteStep()}
      </div>
    </div>
  )
}

interface InsightCardProps {
  insight: Insight
  onToggle: () => void
  onEdit: () => void
  onSave: (content: string) => void
  onCancelEdit: () => void
}

const InsightCard: React.FC<InsightCardProps> = ({ insight, onToggle, onEdit, onSave, onCancelEdit }) => {
  const [editContent, setEditContent] = useState(insight.content)

  const handleSave = () => {
    if (editContent.trim()) {
      onSave(editContent.trim())
    } else {
      onCancelEdit()
    }
  }

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'actionable_tip':
        return '💡'
      case 'quote':
        return '💬'
      case 'statistic':
        return '📊'
      case 'lesson_learned':
        return '🎓'
      default:
        return '🔑'
    }
  }

  return (
    <div className={cn(
      'border rounded-lg p-4 transition-all duration-200',
      insight.isSelected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white'
    )}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors',
            insight.isSelected
              ? 'border-indigo-500 bg-indigo-500 text-white'
              : 'border-gray-300 bg-white'
          )}
        >
          {insight.isSelected ? <Check className="h-3 w-3" /> : null}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getInsightTypeIcon(insight.insight_type)}</span>
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              {insight.insight_type.replace('_', ' ')}
            </span>
            {insight.speaker_attribution && (
              <span className="text-xs text-gray-500">
                by {insight.speaker_attribution}
              </span>
            )}
          </div>

          {insight.isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{editContent.length}/500 characters</span>
                <div className="flex gap-2">
                  <button onClick={onCancelEdit} className="btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button onClick={handleSave} className="btn-primary btn-sm">
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-900">{insight.content}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={onEdit}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <Edit3 className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={onToggle}
                  className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  {insight.isSelected ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {insight.isSelected ? 'Deselect' : 'Select'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 