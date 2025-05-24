'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Sparkles, Type, Volume2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { generateTweets, generateTweetFromVoice } from '@/lib/ai-client'
import { supabase } from '@/lib/supabase'
import { ensureUserExists } from '@/lib/user-utils'
import { ButtonLoading, LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface IdeaCaptureProps {
  onNewTweets: () => void
}

export const IdeaCapture: React.FC<IdeaCaptureProps> = ({ onNewTweets }) => {
  const { user } = useAuth()
  const [textIdea, setTextIdea] = useState('')
  const [tone, setTone] = useState('professional')
  const [targetAudience, setTargetAudience] = useState('')
  const [contentMode, setContentMode] = useState<'thoughtLeadership' | 'communityEngagement' | 'personalBrand' | 'valueFirst' | 'engagementBait'>('thoughtLeadership')
  const [isRecording, setIsRecording] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'text' | 'voice'>('text')
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Load user preferences on mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('users')
          .select('preferences')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') throw error
        
        if (data?.preferences?.defaultTone) {
          setTone(data.preferences.defaultTone)
        }
      } catch (error) {
        console.error('Error loading user preferences:', error)
      }
    }

    loadUserPreferences()
  }, [user])

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      setRecordingDuration(0)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        try {
          if (chunksRef.current.length === 0) {
            toast.error('No audio data recorded')
            return
          }
          
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' })
          const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' })
          
          if (audioFile.size === 0) {
            toast.error('Recording is empty')
            return
          }
          
          await handleVoiceIdea(audioFile)
        } catch (error) {
          console.error('Error processing recording:', error)
          toast.error('Failed to process recording')
        } finally {
          stream.getTracks().forEach(track => track.stop())
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      toast.success('Recording started!')
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleVoiceIdea = async (audioFile: File) => {
    setIsGenerating(true)
    try {
      // Ensure user exists before proceeding
      if (user) {
        await ensureUserExists(user.id, user.email, user.user_metadata?.name)
      }

      // Get user's training examples
      const { data: trainingData } = await supabase
        .from('training_examples')
        .select('tweet_text')
        .eq('user_id', user?.id)

      const trainingExamples = trainingData?.map(example => example.tweet_text) || []
      
      // Generate tweets from voice
      const result = await generateTweetFromVoice(audioFile, trainingExamples, targetAudience.trim() || undefined, contentMode)
      
      // Save the original idea
      const { data: ideaData, error: ideaError } = await supabase
        .from('ideas')
        .insert({
          user_id: user?.id,
          content: 'Voice recording',
          type: 'voice'
        })
        .select()
        .single()

      if (ideaError) throw ideaError

      // Save generated tweets
      const tweetsToInsert = result.tweets.map(scoredTweet => ({
        user_id: user?.id,
        idea_id: ideaData.id,
        content: scoredTweet.content,
        status: 'generated',
        viral_score: scoredTweet.viralScore,
        authenticity_score: scoredTweet.scores.authenticity,
        engagement_score: scoredTweet.scores.engagementPrediction,
        quality_score: scoredTweet.scores.qualitySignals,
        is_engagement_bait: contentMode === 'engagementBait'
      }))

      const { error: tweetsError } = await supabase
        .from('tweets')
        .insert(tweetsToInsert)

      if (tweetsError) throw tweetsError

      onNewTweets()
      
      if (result.scoringEnabled) {
        if (result.improvedByRegeneration && result.regenerationAttempts) {
          toast.success(`Auto-optimized your tweet! Viral score: ${result.finalScore}/100 ✨ (improved through ${result.regenerationAttempts} regeneration${result.regenerationAttempts > 1 ? 's' : ''})`)
        } else {
          toast.success(`Generated tweet with viral score: ${result.tweets[0].viralScore}/100 ✨`)
        }
      } else {
        toast.success(`Generated tweet from your idea! ✨`)
      }
    } catch (error) {
      console.error('Error processing voice idea:', error)
      toast.error('Failed to generate tweets from voice')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleTextIdea = async () => {
    if (!textIdea.trim()) return

    setIsGenerating(true)
    try {
      // Ensure user exists before proceeding
      if (user) {
        await ensureUserExists(user.id, user.email, user.user_metadata?.name)
      }

      // Get user's training examples
      const { data: trainingData } = await supabase
        .from('training_examples')
        .select('tweet_text')
        .eq('user_id', user?.id)

      const trainingExamples = trainingData?.map(example => example.tweet_text) || []
      
      // Generate tweets from text
      const result = await generateTweets({
        idea: textIdea,
        trainingExamples,
        tone,
        targetAudience: targetAudience.trim() || undefined,
        contentMode
      })
      
      // Save the original idea
      const { data: ideaData, error: ideaError } = await supabase
        .from('ideas')
        .insert({
          user_id: user?.id,
          content: textIdea,
          type: 'text'
        })
        .select()
        .single()

      if (ideaError) throw ideaError

      // Save generated tweets with scoring data
      const tweetsToInsert = result.tweets.map(scoredTweet => ({
        user_id: user?.id,
        idea_id: ideaData.id,
        content: scoredTweet.content,
        status: 'generated',
        viral_score: scoredTweet.viralScore,
        authenticity_score: scoredTweet.scores.authenticity,
        engagement_score: scoredTweet.scores.engagementPrediction,
        quality_score: scoredTweet.scores.qualitySignals,
        is_engagement_bait: contentMode === 'engagementBait'
      }))

      const { error: tweetsError } = await supabase
        .from('tweets')
        .insert(tweetsToInsert)

      if (tweetsError) throw tweetsError

      onNewTweets()
      setTextIdea('')
      
      if (result.scoringEnabled) {
        if (result.improvedByRegeneration && result.regenerationAttempts) {
          toast.success(`Auto-optimized your tweet! Viral score: ${result.finalScore}/100 ✨ (improved through ${result.regenerationAttempts} regeneration${result.regenerationAttempts > 1 ? 's' : ''})`)
        } else {
          toast.success(`Generated tweet with viral score: ${result.tweets[0].viralScore}/100 ✨`)
        }
      } else {
        toast.success(`Generated tweet from your idea! ✨`)
      }
    } catch (error) {
      console.error('Error processing text idea:', error)
      toast.error('Failed to generate tweets from text')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="card relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Capture New Idea</h2>
          <p className="text-sm text-gray-600">Transform your thoughts into viral tweets</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('text')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
            activeTab === 'text'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <Type className="h-4 w-4" />
          Type Idea
        </button>
        <button
          onClick={() => setActiveTab('voice')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
            activeTab === 'voice'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <Volume2 className="h-4 w-4" />
          Voice Memo
        </button>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {activeTab === 'text' && (
          <div className="space-y-4 animate-fade-in">
            {/* Content Mode Selection */}
            <div className="form-group">
              <label className="form-label">
                Content Mode <span className="text-gray-400 font-normal">(optimized for Twitter algorithm)</span>
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setContentMode('thoughtLeadership')}
                  disabled={isGenerating}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all duration-200',
                    contentMode === 'thoughtLeadership'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🎯</span>
                    <span className="font-medium text-sm">Thought Leadership</span>
                  </div>
                  <p className="text-xs text-gray-600">Industry insights & expertise</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setContentMode('communityEngagement')}
                  disabled={isGenerating}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all duration-200',
                    contentMode === 'communityEngagement'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">💬</span>
                    <span className="font-medium text-sm">Community Engagement</span>
                  </div>
                  <p className="text-xs text-gray-600">Questions & conversations</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setContentMode('personalBrand')}
                  disabled={isGenerating}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all duration-200',
                    contentMode === 'personalBrand'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">👤</span>
                    <span className="font-medium text-sm">Personal Brand</span>
                  </div>
                  <p className="text-xs text-gray-600">Authentic personal stories</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setContentMode('valueFirst')}
                  disabled={isGenerating}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all duration-200',
                    contentMode === 'valueFirst'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📚</span>
                    <span className="font-medium text-sm">Value-First Content</span>
                  </div>
                  <p className="text-xs text-gray-600">Tips & actionable advice</p>
                </button>

                <button
                  type="button"
                  onClick={() => setContentMode('engagementBait')}
                  disabled={isGenerating}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all duration-200 col-span-2 lg:col-span-1',
                    contentMode === 'engagementBait'
                      ? 'border-red-500 bg-red-50 text-red-900'
                      : 'border-red-200 bg-white text-red-700 hover:border-red-300'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">😈</span>
                    <span className="font-medium text-sm">Engagement Bait</span>
                  </div>
                  <p className="text-xs text-red-600">Controversial & provocative</p>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Each mode uses specialized prompts optimized for different engagement patterns. ⚠️ Use engagement bait responsibly.
              </p>
            </div>

            {/* Text Input */}
            <div className="form-group">
              <label className="form-label">
                What&apos;s on your mind?
              </label>
              <div className="relative">
                <textarea
                  value={textIdea}
                  onChange={(e) => setTextIdea(e.target.value)}
                  placeholder="Share your thoughts, insights, or ideas that you'd like to turn into engaging tweets..."
                  className="input-field resize-none pr-20"
                  rows={4}
                  disabled={isGenerating}
                  maxLength={500}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {textIdea.length}/500
                </div>
              </div>
            </div>

            {/* Target Audience Input */}
            <div className="form-group">
              <label className="form-label">
                Target Audience <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <textarea
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Describe your target audience... e.g. 'Tech entrepreneurs and startup founders interested in AI and productivity tools'"
                  className="input-field resize-none pr-20"
                  rows={2}
                  disabled={isGenerating}
                  maxLength={200}
                />
                <div className="absolute bottom-2 right-3 text-xs text-gray-400">
                  {targetAudience.length}/200
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Help us tailor the content for your specific audience to improve engagement and authenticity.
              </p>
            </div>

            {/* Tone Selection */}
            <div className="form-group">
              <label className="form-label">Tone & Style</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="input-field"
                disabled={isGenerating}
              >
                <option value="professional">🏢 Professional</option>
                <option value="casual">😊 Casual</option>
                <option value="humorous">😄 Humorous</option>
                <option value="educational">📚 Educational</option>
                <option value="inspirational">✨ Inspirational</option>
              </select>
            </div>

            {/* Generate Button */}
            <ButtonLoading
              onClick={handleTextIdea}
              loading={isGenerating}
              loadingText="Generating tweets..."
              disabled={!textIdea.trim()}
              className="w-full btn-lg"
            >
              <Sparkles className="h-5 w-5" />
              Generate Tweets
            </ButtonLoading>
          </div>
        )}

        {activeTab === 'voice' && (
          <div className="space-y-6 animate-fade-in">
            {/* Content Mode Selection for Voice */}
            <div className="form-group">
              <label className="form-label">
                Content Mode <span className="text-gray-400 font-normal">(voice recording will be optimized for this mode)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setContentMode('thoughtLeadership')}
                  disabled={isGenerating || isRecording}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all duration-200',
                    contentMode === 'thoughtLeadership'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🎯</span>
                    <span className="font-medium text-sm">Thought Leadership</span>
                  </div>
                  <p className="text-xs text-gray-600">Industry insights & expertise</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setContentMode('communityEngagement')}
                  disabled={isGenerating || isRecording}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all duration-200',
                    contentMode === 'communityEngagement'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">💬</span>
                    <span className="font-medium text-sm">Community Engagement</span>
                  </div>
                  <p className="text-xs text-gray-600">Questions & conversations</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setContentMode('personalBrand')}
                  disabled={isGenerating || isRecording}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all duration-200',
                    contentMode === 'personalBrand'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">👤</span>
                    <span className="font-medium text-sm">Personal Brand</span>
                  </div>
                  <p className="text-xs text-gray-600">Authentic personal stories</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => setContentMode('valueFirst')}
                  disabled={isGenerating || isRecording}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all duration-200',
                    contentMode === 'valueFirst'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📚</span>
                    <span className="font-medium text-sm">Value-First Content</span>
                  </div>
                  <p className="text-xs text-gray-600">Tips & actionable advice</p>
                </button>

                <button
                  type="button"
                  onClick={() => setContentMode('engagementBait')}
                  disabled={isGenerating || isRecording}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all duration-200 col-span-2',
                    contentMode === 'engagementBait'
                      ? 'border-red-500 bg-red-50 text-red-900'
                      : 'border-red-200 bg-white text-red-700 hover:border-red-300'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">😈</span>
                    <span className="font-medium text-sm">Engagement Bait</span>
                  </div>
                  <p className="text-xs text-red-600">Controversial & provocative</p>
                </button>
              </div>
            </div>

            {/* Recording Interface */}
            <div className="text-center">
              <div className={cn(
                'relative mx-auto w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300',
                isRecording 
                  ? 'bg-red-100 animate-pulse-subtle' 
                  : 'bg-indigo-100 hover:bg-indigo-200'
              )}>
                {isRecording && (
                  <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping" />
                )}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isGenerating}
                  className={cn(
                    'w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl',
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  )}
                >
                  {isRecording ? (
                    <Square className="h-8 w-8" />
                  ) : (
                    <Mic className="h-8 w-8" />
                  )}
                </button>
              </div>

              <div className="mt-4">
                {isRecording ? (
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-red-600">Recording...</p>
                    <p className="text-2xl font-mono text-gray-900">{formatDuration(recordingDuration)}</p>
                    <p className="text-sm text-gray-500">Speak naturally about your ideas</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-900">Ready to record</p>
                    <p className="text-sm text-gray-500">Click the microphone to start recording your voice memo</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mode-Specific Recording Tips */}
            <div className={cn(
              'rounded-lg p-4',
              contentMode === 'engagementBait' ? 'bg-red-50' : 'bg-indigo-50'
            )}>
              <h4 className={cn(
                'font-medium mb-3',
                contentMode === 'engagementBait' ? 'text-red-900' : 'text-indigo-900'
              )}>
                💡 Recording Tips for {contentMode === 'thoughtLeadership' ? 'Thought Leadership' : 
                                     contentMode === 'communityEngagement' ? 'Community Engagement' :
                                     contentMode === 'personalBrand' ? 'Personal Brand' : 
                                     contentMode === 'valueFirst' ? 'Value-First Content' : 'Engagement Bait'}:
              </h4>
              <ul className={cn(
                'text-sm space-y-1',
                contentMode === 'engagementBait' ? 'text-red-700' : 'text-indigo-700'
              )}>
                {contentMode === 'thoughtLeadership' && (
                  <>
                    <li>• Share professional insights from your experience</li>
                    <li>• Mention industry trends or observations</li>
                    <li>• Express opinions on recent developments</li>
                    <li>• Reference your expertise or background</li>
                  </>
                )}
                {contentMode === 'communityEngagement' && (
                  <>
                    <li>• Ask open-ended questions to your audience</li>
                    <li>• Share relatable daily experiences</li>
                    <li>• Mention challenges you&apos;re curious about</li>
                    <li>• Invite others to share their perspectives</li>
                  </>
                )}
                {contentMode === 'personalBrand' && (
                  <>
                    <li>• Share personal stories or experiences</li>
                    <li>• Talk about your journey or lessons learned</li>
                    <li>• Be authentic about challenges and growth</li>
                    <li>• Connect personal moments to broader themes</li>
                  </>
                )}
                {contentMode === 'valueFirst' && (
                  <>
                    <li>• Share practical tips or actionable advice</li>
                    <li>• Mention tools or resources you recommend</li>
                    <li>• Explain step-by-step processes</li>
                    <li>• Focus on helping others solve problems</li>
                  </>
                )}
                {contentMode === 'engagementBait' && (
                  <>
                    <li>• Express controversial or unpopular opinions</li>
                    <li>• Challenge widely accepted beliefs or practices</li>
                    <li>• Make bold, divisive statements about your industry</li>
                    <li>• ⚠️ Remember: Use responsibly and consider your brand</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Generating State */}
        {isGenerating && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-xl">
            <div className="text-center space-y-4">
              <LoadingSpinner size="xl" variant="primary" />
              <div>
                <p className="font-medium text-gray-900">Generating your tweets...</p>
                <p className="text-sm text-gray-600">Our AI is crafting engaging content from your idea</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 