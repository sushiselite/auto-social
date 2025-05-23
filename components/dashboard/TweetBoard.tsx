'use client'

import React, { useState, useEffect } from 'react'
import { 
  Edit, 
  RotateCcw, 
  Clock, 
  CheckCircle, 
  Send,
  MoreVertical,
  Calendar,
  Trash2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { generateTweets } from '@/lib/ai-client'
import { useAuth } from '@/components/providers/AuthProvider'
import toast from 'react-hot-toast'

// Separate component to handle feedback input without re-renders
const RegenerationFeedbackInput: React.FC<{
  tweetId: string
  value: string
  onFeedbackChange: (tweetId: string, value: string) => void
}> = React.memo(({ tweetId, value, onFeedbackChange }) => {
  const [localValue, setLocalValue] = useState(value)

  // Update local value when prop changes (but don't lose focus)
  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    onFeedbackChange(tweetId, newValue)
  }, [tweetId, onFeedbackChange])

  return (
    <input
      type="text"
      placeholder="Add feedback for regeneration..."
      value={localValue}
      onChange={handleChange}
      className="w-full p-2 text-xs border rounded"
    />
  )
}, (prevProps, nextProps) => {
  // Only re-render if tweetId changes (not value changes)
  return prevProps.tweetId === nextProps.tweetId
})

interface Tweet {
  id: string
  content: string
  status: 'generated' | 'in_review' | 'approved' | 'published'
  created_at: string
  scheduled_time?: string
  performance?: any
  idea_id?: string
}

interface TweetBoardProps {
  tweets: Tweet[]
  loading: boolean
  onTweetUpdate: (tweet: Tweet) => void
  onTweetDelete?: (tweetId: string) => void
}

const statusConfig = {
  generated: {
    title: 'Generated',
    icon: Edit,
    color: 'bg-blue-50 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-700'
  },
  in_review: {
    title: 'In Review',
    icon: Clock,
    color: 'bg-yellow-50 border-yellow-200',
    badgeColor: 'bg-yellow-100 text-yellow-700'
  },
  approved: {
    title: 'Approved',
    icon: CheckCircle,
    color: 'bg-green-50 border-green-200',
    badgeColor: 'bg-green-100 text-green-700'
  },
  published: {
    title: 'Published',
    icon: Send,
    color: 'bg-gray-50 border-gray-200',
    badgeColor: 'bg-gray-100 text-gray-700'
  }
}

export const TweetBoard: React.FC<TweetBoardProps> = ({ tweets, loading, onTweetUpdate, onTweetDelete }) => {
  const { user } = useAuth()
  const [editingTweet, setEditingTweet] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [regeneratingTweet, setRegeneratingTweet] = useState<string | null>(null)
  const [regeneratingBoard, setRegeneratingBoard] = useState<boolean>(false)
  const [regenerateFeedback, setRegenerateFeedback] = useState<{[key: string]: string}>({})
  const [userPreferences, setUserPreferences] = useState<any>(null)

  // Stable callback for feedback changes
  const handleFeedbackChange = React.useCallback((tweetId: string, value: string) => {
    setRegenerateFeedback(prev => ({ ...prev, [tweetId]: value }))
  }, [])

  // Load user preferences
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
        
        if (data?.preferences) {
          setUserPreferences(data.preferences)
        }
      } catch (error) {
        console.error('Error loading user preferences:', error)
      }
    }

    loadUserPreferences()
  }, [user])

  const updateTweetStatus = async (tweetId: string, newStatus: Tweet['status']) => {
    try {
      const { data, error } = await supabase
        .from('tweets')
        .update({ status: newStatus })
        .eq('id', tweetId)
        .select()
        .single()

      if (error) throw error

      onTweetUpdate(data)
      toast.success(`Tweet moved to ${statusConfig[newStatus].title}`)
    } catch (error) {
      console.error('Error updating tweet status:', error)
      toast.error('Failed to update tweet status')
    }
  }

  const updateTweetContent = async (tweetId: string, newContent: string) => {
    try {
      const { data, error } = await supabase
        .from('tweets')
        .update({ content: newContent })
        .eq('id', tweetId)
        .select()
        .single()

      if (error) throw error

      onTweetUpdate(data)
      setEditingTweet(null)
      toast.success('Tweet updated successfully')
    } catch (error) {
      console.error('Error updating tweet:', error)
      toast.error('Failed to update tweet')
    }
  }

  const regenerateTweet = async (tweet: Tweet) => {
    setRegeneratingTweet(tweet.id)
    setRegeneratingBoard(true)
    try {
      // Get the original idea
      const { data: ideaData } = await supabase
        .from('ideas')
        .select('content')
        .eq('id', tweet.idea_id)
        .single()

      // Get training examples
      const { data: trainingData } = await supabase
        .from('training_examples')
        .select('tweet_text')
        .eq('user_id', user?.id)

      const trainingExamples = trainingData?.map(example => example.tweet_text) || []

      // Generate new tweets
      const newTweets = await generateTweets({
        idea: ideaData?.content || tweet.content,
        trainingExamples,
        regenerationFeedback: regenerateFeedback[tweet.id] || '',
        tone: userPreferences?.defaultTone || 'professional'
      })

      if (newTweets.length > 0) {
        // Update the current tweet with the first generated option
        await updateTweetContent(tweet.id, newTweets[0])
        setRegenerateFeedback(prev => ({ ...prev, [tweet.id]: '' }))
      }

      toast.success('Tweet regenerated successfully')
    } catch (error) {
      console.error('Error regenerating tweet:', error)
      toast.error('Failed to regenerate tweet')
    } finally {
      setRegeneratingTweet(null)
      setRegeneratingBoard(false)
    }
  }

  const scheduleTweet = async (tweetId: string) => {
    // Simple scheduling - set for next hour for demo
    const scheduledTime = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    
    try {
      const { data, error } = await supabase
        .from('tweets')
        .update({ 
          scheduled_time: scheduledTime,
          status: 'approved'
        })
        .eq('id', tweetId)
        .select()
        .single()

      if (error) throw error

      onTweetUpdate(data)
      toast.success('Tweet scheduled for publication')
    } catch (error) {
      console.error('Error scheduling tweet:', error)
      toast.error('Failed to schedule tweet')
    }
  }

  const getStatusTweets = (status: Tweet['status']) => {
    return tweets.filter(tweet => tweet.status === status)
  }

  const deleteTweet = async (tweetId: string) => {
    try {
      const { error } = await supabase
        .from('tweets')
        .delete()
        .eq('id', tweetId)

      if (error) throw error

      // Notify parent component to remove from state
      if (onTweetDelete) {
        onTweetDelete(tweetId)
      }
      
      toast.success('Tweet deleted successfully')
    } catch (error) {
      console.error('Error deleting tweet:', error)
      toast.error('Failed to delete tweet')
    }
  }

  const TweetCard = ({ tweet }: { tweet: Tweet }) => {
    const config = statusConfig[tweet.status]
    const isEditing = editingTweet === tweet.id
    const isRegenerating = regeneratingTweet === tweet.id

    return (
      <div className={`p-4 rounded-lg border-2 ${config.color} mb-3`}>
        <div className="flex items-start justify-between mb-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.badgeColor}`}>
            {config.title}
          </span>
          <div className="flex gap-1">
            {tweet.status === 'generated' && (
              <>
                <button
                  onClick={() => {
                    setEditingTweet(tweet.id)
                    setEditContent(tweet.content)
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => regenerateTweet(tweet)}
                  disabled={isRegenerating}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <RotateCcw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                </button>
              </>
            )}
            {tweet.status === 'approved' && (
              <button
                onClick={() => scheduleTweet(tweet.id)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <Calendar className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => deleteTweet(tweet.id)}
              className="p-1 text-gray-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 text-sm border rounded resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingTweet(null)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => updateTweetContent(tweet.id, editContent)}
                className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-900 mb-3">{tweet.content}</p>
        )}

        {tweet.status === 'generated' && !isEditing && (
          <div className="space-y-2">
            <RegenerationFeedbackInput 
              key={`feedback-input-${tweet.id}`}
              tweetId={tweet.id}
              value={regenerateFeedback[tweet.id] || ''}
              onFeedbackChange={handleFeedbackChange}
            />
            <div className="flex justify-between">
              <button
                onClick={() => updateTweetStatus(tweet.id, 'in_review')}
                className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
              >
                Move to Review
              </button>
              <button
                onClick={() => updateTweetStatus(tweet.id, 'approved')}
                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                Approve
              </button>
            </div>
          </div>
        )}

        {tweet.status === 'in_review' && (
          <div className="flex justify-between">
            <button
              onClick={() => updateTweetStatus(tweet.id, 'generated')}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Back to Generated
            </button>
            <button
              onClick={() => updateTweetStatus(tweet.id, 'approved')}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Approve
            </button>
          </div>
        )}

        {tweet.status === 'approved' && (
          <div className="flex justify-center mt-3">
            <button
              onClick={() => updateTweetStatus(tweet.id, 'published')}
              className="px-4 py-2 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center gap-1"
            >
              <Send className="h-3 w-3" />
              Move to Published
            </button>
          </div>
        )}

        {tweet.scheduled_time && (
          <div className="mt-2 text-xs text-gray-500">
            Scheduled: {new Date(tweet.scheduled_time).toLocaleString()}
          </div>
        )}

        <div className="mt-2 text-xs text-gray-400">
          Created: {new Date(tweet.created_at).toLocaleDateString()}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Tweet Management</h2>
        {regeneratingBoard && (
          <div className="flex items-center gap-2 text-purple-600">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent"></div>
            <span className="text-sm font-medium">Regenerating tweet...</span>
          </div>
        )}
      </div>
      
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity duration-300 ${regeneratingBoard ? 'opacity-50' : 'opacity-100'}`}>
        {(Object.keys(statusConfig) as Array<Tweet['status']>).map((status) => {
          const config = statusConfig[status]
          const statusTweets = getStatusTweets(status)
          const Icon = config.icon

          return (
            <div key={status} className="space-y-4">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">{config.title}</h3>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  {statusTweets.length}
                </span>
              </div>
              
              <div className="space-y-3 min-h-[200px]">
                {statusTweets.map((tweet) => (
                  <TweetCard key={tweet.id} tweet={tweet} />
                ))}
                
                {statusTweets.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No tweets in {config.title.toLowerCase()}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 