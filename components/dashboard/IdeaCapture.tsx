'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Plus, Square } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { generateTweets, generateTweetFromVoice } from '@/lib/ai-client'
import { supabase } from '@/lib/supabase'
import { ensureUserExists } from '@/lib/user-utils'
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

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
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording')
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
      toast.success(`Generated ${generatedTweets.length} tweets from your voice memo!`)
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
      toast.success(`Generated ${generatedTweets.length} tweets from your idea!`)
    } catch (error) {
      console.error('Error processing text idea:', error)
      toast.error('Failed to generate tweets from text')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Capture New Idea</h2>
      
      <div className="space-y-4">
        {/* Text Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type your idea
          </label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <textarea
                value={textIdea}
                onChange={(e) => setTextIdea(e.target.value)}
                placeholder="What's on your mind? Describe your tweet idea..."
                className="input-field resize-none"
                rows={3}
                disabled={isGenerating}
              />
              <button
                onClick={handleTextIdea}
                disabled={!textIdea.trim() || isGenerating}
                className="btn-primary h-fit"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {textIdea.length} characters
              </span>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
                disabled={isGenerating}
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="humorous">Humorous</option>
                <option value="educational">Educational</option>
                <option value="inspirational">Inspirational</option>
              </select>
            </div>
          </div>
        </div>

        {/* Voice Recording */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or record a voice memo
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="h-4 w-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Start Recording
                </>
              )}
            </button>
            
            {isRecording && (
              <div className="flex items-center gap-2 text-red-600">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                Recording...
              </div>
            )}
          </div>
        </div>

        {isGenerating && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Generating tweets...</span>
          </div>
        )}
      </div>
    </div>
  )
} 