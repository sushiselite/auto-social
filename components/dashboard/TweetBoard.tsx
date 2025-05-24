'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
      className="w-full p-2 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
    />
  )
}, (prevProps, nextProps) => {
  // Only re-render if tweetId changes (not value changes)
  return prevProps.tweetId === nextProps.tweetId
})

RegenerationFeedbackInput.displayName = 'RegenerationFeedbackInput'

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

// Memoized TweetCard component to prevent unnecessary re-renders
interface TweetCardProps {
  tweet: Tweet
  editingTweet: string | null
  editContent: string
  regeneratingTweet: string | null
  regenerateFeedback: { [key: string]: string }
  onStartEdit: (tweetId: string, content: string) => void
  onCancelEdit: () => void
  onSaveEdit: (tweetId: string, content: string) => void
  onUpdateEditContent: (content: string) => void
  onRegenerateTweet: (tweet: Tweet) => void
  onUpdateStatus: (tweetId: string, status: Tweet['status']) => void
  onScheduleTweet: (tweetId: string) => void
  onDeleteTweet: (tweetId: string) => void
  onFeedbackChange: (tweetId: string, value: string) => void
}

const TweetCard = React.memo<TweetCardProps>(({ 
  tweet, 
  editingTweet, 
  editContent, 
  regeneratingTweet,
  regenerateFeedback,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onUpdateEditContent,
  onRegenerateTweet,
  onUpdateStatus,
  onScheduleTweet,
  onDeleteTweet,
  onFeedbackChange
}) => {
  const config = statusConfig[tweet.status]
  const isEditing = editingTweet === tweet.id
  const isRegenerating = regeneratingTweet === tweet.id

  return (
    <div className={`card-hover p-4 border-2 ${config.color} mb-3 transition-all duration-200`}>
      <div className="flex items-start justify-between mb-2">
        <span className={`badge ${config.badgeColor}`}>
          {config.title}
        </span>
        <div className="flex gap-1">
          {tweet.status === 'generated' && (
            <>
              <button
                onClick={() => onStartEdit(tweet.id, tweet.content)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded"
                title="Edit tweet"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => onRegenerateTweet(tweet)}
                disabled={isRegenerating}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded disabled:opacity-50"
                title="Regenerate tweet"
              >
                <RotateCcw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              </button>
            </>
          )}
          {tweet.status === 'approved' && (
            <button
              onClick={() => onScheduleTweet(tweet.id)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded"
              title="Schedule tweet"
            >
              <Calendar className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onDeleteTweet(tweet.id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200 rounded"
            title="Delete tweet"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => onUpdateEditContent(e.target.value)}
            className="input-field resize-none"
            rows={3}
            placeholder="Edit your tweet content..."
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancelEdit}
              className="btn-ghost btn-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => onSaveEdit(tweet.id, editContent)}
              className="btn-primary btn-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-900 mb-3 leading-relaxed">{tweet.content}</p>
      )}

      {tweet.status === 'generated' && !isEditing && (
        <div className="space-y-3">
          <RegenerationFeedbackInput 
            tweetId={tweet.id}
            value={regenerateFeedback[tweet.id] || ''}
            onFeedbackChange={onFeedbackChange}
          />
          <div className="flex justify-between gap-2">
            <button
              onClick={() => onUpdateStatus(tweet.id, 'in_review')}
              className="btn-secondary btn-sm flex-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
            >
              Move to Review
            </button>
            <button
              onClick={() => onUpdateStatus(tweet.id, 'approved')}
              className="btn-secondary btn-sm flex-1 bg-green-100 text-green-700 hover:bg-green-200"
            >
              Approve
            </button>
          </div>
        </div>
      )}

      {tweet.status === 'in_review' && (
        <div className="flex justify-between gap-2">
          <button
            onClick={() => onUpdateStatus(tweet.id, 'generated')}
            className="btn-secondary btn-sm flex-1 bg-blue-100 text-blue-700 hover:bg-blue-200"
          >
            Back to Generated
          </button>
          <button
            onClick={() => onUpdateStatus(tweet.id, 'approved')}
            className="btn-secondary btn-sm flex-1 bg-green-100 text-green-700 hover:bg-green-200"
          >
            Approve
          </button>
        </div>
      )}

      {tweet.status === 'approved' && (
        <div className="flex justify-center mt-3">
          <button
            onClick={() => onUpdateStatus(tweet.id, 'published')}
            className="btn-primary btn-sm gap-1"
          >
            <Send className="h-3 w-3" />
            Publish Tweet
          </button>
        </div>
      )}

      {tweet.scheduled_time && (
        <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
          Scheduled: {new Date(tweet.scheduled_time).toLocaleString()}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-400">
        Created: {new Date(tweet.created_at).toLocaleDateString()}
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.tweet.id === nextProps.tweet.id &&
    prevProps.tweet.content === nextProps.tweet.content &&
    prevProps.tweet.status === nextProps.tweet.status &&
    prevProps.editingTweet === nextProps.editingTweet &&
    prevProps.editContent === nextProps.editContent &&
    prevProps.regeneratingTweet === nextProps.regeneratingTweet &&
    prevProps.regenerateFeedback[prevProps.tweet.id] === nextProps.regenerateFeedback[nextProps.tweet.id]
  )
})

TweetCard.displayName = 'TweetCard'

export const TweetBoard: React.FC<TweetBoardProps> = ({ tweets, loading, onTweetUpdate, onTweetDelete }) => {
  const { user } = useAuth()
  const [editingTweet, setEditingTweet] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [regeneratingTweet, setRegeneratingTweet] = useState<string | null>(null)
  const [regeneratingBoard, setRegeneratingBoard] = useState<boolean>(false)
  const [regenerateFeedback, setRegenerateFeedback] = useState<{[key: string]: string}>({})
  const [userPreferences, setUserPreferences] = useState<any>(null)

  // Stable callback for feedback changes
  const handleFeedbackChange = useCallback((tweetId: string, value: string) => {
    setRegenerateFeedback(prev => ({ ...prev, [tweetId]: value }))
  }, [])

  // Stable callbacks for tweet actions
  const handleStartEdit = useCallback((tweetId: string, content: string) => {
    setEditingTweet(tweetId)
    setEditContent(content)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setEditingTweet(null)
    setEditContent('')
  }, [])

  const handleUpdateEditContent = useCallback((content: string) => {
    setEditContent(content)
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

  const updateTweetStatus = useCallback(async (tweetId: string, newStatus: Tweet['status']) => {
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
  }, [onTweetUpdate])

  const updateTweetContent = useCallback(async (tweetId: string, newContent: string) => {
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
      setEditContent('')
      toast.success('Tweet updated successfully')
    } catch (error) {
      console.error('Error updating tweet:', error)
      toast.error('Failed to update tweet')
    }
  }, [onTweetUpdate])

  const regenerateTweet = useCallback(async (tweet: Tweet) => {
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
        // Update the existing tweet with the first generated tweet
        const { data, error } = await supabase
          .from('tweets')
          .update({ content: newTweets[0] })
          .eq('id', tweet.id)
          .select()
          .single()

        if (error) throw error

        onTweetUpdate(data)
        toast.success('Tweet regenerated successfully!')
        
        // Clear the feedback for this tweet
        setRegenerateFeedback(prev => ({ ...prev, [tweet.id]: '' }))
      }
    } catch (error) {
      console.error('Error regenerating tweet:', error)
      toast.error('Failed to regenerate tweet')
    } finally {
      setRegeneratingTweet(null)
      setRegeneratingBoard(false)
    }
  }, [user?.id, regenerateFeedback, userPreferences, onTweetUpdate])

  const scheduleTweet = useCallback(async (tweetId: string) => {
    try {
      // For now, just update status to published
      // In the future, integrate with actual scheduling service
      const { data, error } = await supabase
        .from('tweets')
        .update({ 
          status: 'published',
          scheduled_time: new Date().toISOString()
        })
        .eq('id', tweetId)
        .select()
        .single()

      if (error) throw error

      onTweetUpdate(data)
      toast.success('Tweet scheduled successfully!')
    } catch (error) {
      console.error('Error scheduling tweet:', error)
      toast.error('Failed to schedule tweet')
    }
  }, [onTweetUpdate])

  const deleteTweet = useCallback(async (tweetId: string) => {
    if (!window.confirm('Are you sure you want to delete this tweet?')) return

    try {
      const { error } = await supabase
        .from('tweets')
        .delete()
        .eq('id', tweetId)

      if (error) throw error

      if (onTweetDelete) {
        onTweetDelete(tweetId)
      }
      
      toast.success('Tweet deleted successfully')
    } catch (error) {
      console.error('Error deleting tweet:', error)
      toast.error('Failed to delete tweet')
    }
  }, [onTweetDelete])

  const getStatusTweets = useCallback((status: Tweet['status']) => {
    return tweets.filter(tweet => tweet.status === status)
  }, [tweets])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Tweet Management</h2>
        {regeneratingBoard && (
          <div className="flex items-center gap-2 text-indigo-600">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
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
                <span className="badge badge-secondary">
                  {statusTweets.length}
                </span>
              </div>
              
              <div className="space-y-3 min-h-[200px]">
                {statusTweets.map((tweet) => (
                  <TweetCard 
                    key={tweet.id} 
                    tweet={tweet}
                    editingTweet={editingTweet}
                    editContent={editContent}
                    regeneratingTweet={regeneratingTweet}
                    regenerateFeedback={regenerateFeedback}
                    onStartEdit={handleStartEdit}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={updateTweetContent}
                    onUpdateEditContent={handleUpdateEditContent}
                    onRegenerateTweet={regenerateTweet}
                    onUpdateStatus={updateTweetStatus}
                    onScheduleTweet={scheduleTweet}
                    onDeleteTweet={deleteTweet}
                    onFeedbackChange={handleFeedbackChange}
                  />
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