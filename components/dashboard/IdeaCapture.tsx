'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Plus, Square, Sparkles, Type, Volume2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { generateTweets, generateTweetFromVoice } from '@/lib/ai-client'
import { supabase } from '@/lib/supabase'
import { ensureUserExists } from '@/lib/user-utils'
import { ButtonLoading, LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface IdeaCaptureProps {
  onNewTweets: (tweets: any[]) => void
}

export const IdeaCapture: React.FC<IdeaCaptureProps> = ({ onNewTweets }) => {
  const { user } = useAuth()
  const [textIdea, setTextIdea] = useState('')
  const [tone, setTone] = useState('professional')
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
      const generatedTweets = await generateTweetFromVoice(audioFile, trainingExamples)
      
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
      const tweetsToInsert = generatedTweets.map(content => ({
        user_id: user?.id,
        idea_id: ideaData.id,
        content,
        status: 'generated'
      }))

      const { data: tweetsData, error: tweetsError } = await supabase
        .from('tweets')
        .insert(tweetsToInsert)
        .select()

      if (tweetsError) throw tweetsError

      onNewTweets(tweetsData)
      toast.success(`Generated ${generatedTweets.length} tweets from your voice memo! 🎉`)
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
      const generatedTweets = await generateTweets({
        idea: textIdea,
        trainingExamples,
        tone
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

      // Save generated tweets
      const tweetsToInsert = generatedTweets.map(content => ({
        user_id: user?.id,
        idea_id: ideaData.id,
        content,
        status: 'generated'
      }))

      const { data: tweetsData, error: tweetsError } = await supabase
        .from('tweets')
        .insert(tweetsToInsert)
        .select()

      if (tweetsError) throw tweetsError

      onNewTweets(tweetsData)
      setTextIdea('')
      toast.success(`Generated ${generatedTweets.length} tweets from your idea! ✨`)
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
            {/* Text Input */}
            <div className="form-group">
              <label className="form-label">
                What's on your mind?
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

            {/* Recording Tips */}
            <div className="bg-indigo-50 rounded-lg p-4">
              <h4 className="font-medium text-indigo-900 mb-2">💡 Recording Tips:</h4>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>• Speak clearly and at a normal pace</li>
                <li>• Share your thoughts, opinions, or insights</li>
                <li>• Mention any specific topics or themes</li>
                <li>• Keep it under 2 minutes for best results</li>
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