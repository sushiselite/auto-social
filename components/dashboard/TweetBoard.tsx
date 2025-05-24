'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Edit, 
  Clock, 
  CheckCircle, 
  Send,
  Trash2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { generateTweets } from '@/lib/ai-client'
import { useAuth } from '@/components/providers/AuthProvider'
import { TweetModal } from '@/components/ui/TweetModal'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

// Drag and Drop imports
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  KeyboardSensor,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'

interface Tweet {
  id: string
  content: string
  status: 'generated' | 'in_review' | 'approved' | 'published'
  created_at: string
  scheduled_time?: string
  performance?: Record<string, unknown>
  idea_id?: string
  viral_score?: number
  authenticity_score?: number
  engagement_score?: number
  quality_score?: number
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

// Simplified Tweet Card
interface SimpleTweetCardProps {
  tweet: Tweet
  onTweetClick: (tweet: Tweet) => void
  onTweetDelete?: (tweetId: string) => void
  className?: string
}

const SimpleTweetCard = React.memo<SimpleTweetCardProps>(({ 
  tweet, 
  onTweetClick,
  onTweetDelete,
  className = ''
}) => {
  const config = statusConfig[tweet.status]
  
  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const getViralScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onTweetDelete) {
      onTweetDelete(tweet.id)
    }
  }

  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 group relative ${className}`}
      onClick={() => onTweetClick(tweet)}
    >
      <div className="p-4">
        {/* Header with status */}
        <div className="flex items-start justify-between mb-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.badgeColor}`}>
            {config.title}
          </span>
          {tweet.viral_score && (
            <div className="text-right">
              <div className={`text-lg font-bold ${getViralScoreColor(tweet.viral_score)}`}>
                {tweet.viral_score}
              </div>
              <div className="text-xs text-gray-500">viral score</div>
            </div>
          )}
        </div>

        {/* Tweet content preview */}
        <p className="text-gray-900 text-sm leading-relaxed mb-3">
          {truncateContent(tweet.content)}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatDate(tweet.created_at)}</span>
          {/* Delete button - positioned in bottom right */}
          {onTweetDelete && (
            <button
              onClick={handleDeleteClick}
              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Delete tweet"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

SimpleTweetCard.displayName = 'SimpleTweetCard'

// Draggable Tweet Card
interface DraggableTweetCardProps extends SimpleTweetCardProps {
  isDragging?: boolean
}

const DraggableTweetCard = React.memo<DraggableTweetCardProps>(({ 
  tweet,
  isDragging = false,
  ...props
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: tweet.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'z-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      <SimpleTweetCard
        tweet={tweet}
        {...props}
        className="cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-lg"
      />
    </div>
  )
})

DraggableTweetCard.displayName = 'DraggableTweetCard'

// Droppable Column
interface DroppableColumnProps {
  status: Tweet['status']
  children: React.ReactNode
  title: string
  count: number
  icon: React.ElementType
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({ 
  status, 
  children, 
  title, 
  count, 
  icon: Icon 
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${status}`,
  })

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className={`p-2 rounded-lg ${
          status === 'generated' ? 'bg-blue-100' :
          status === 'in_review' ? 'bg-yellow-100' :
          status === 'approved' ? 'bg-green-100' :
          'bg-gray-100'
        }`}>
          <Icon className={`h-5 w-5 ${
            status === 'generated' ? 'text-blue-600' :
            status === 'in_review' ? 'text-yellow-600' :
            status === 'approved' ? 'text-green-600' :
            'text-gray-600'
          }`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
          <p className="text-sm text-gray-500">{count} {count === 1 ? 'tweet' : 'tweets'}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          status === 'generated' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
          status === 'in_review' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
          status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
          'bg-gray-50 text-gray-700 border border-gray-200'
        }`}>
          {count}
        </div>
      </div>
      
      {/* Drop Zone */}
      <div 
        ref={setNodeRef}
        className={`flex-1 min-h-[500px] p-4 rounded-xl border-2 border-dashed transition-all duration-200 ${
          isOver 
            ? 'border-indigo-400 bg-indigo-50 shadow-lg' 
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <div className="space-y-4">
          {children}
        </div>
        
        {count === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className={`w-16 h-16 rounded-full mb-4 flex items-center justify-center ${
              isOver ? 'bg-indigo-100' : 'bg-gray-100'
            }`}>
              <Icon className={`h-8 w-8 ${
                isOver ? 'text-indigo-500' : 'text-gray-400'
              }`} />
            </div>
            <p className={`text-lg font-medium mb-2 ${
              isOver ? 'text-indigo-600' : 'text-gray-500'
            }`}>
              {isOver ? 'Drop tweet here' : `No ${title.toLowerCase()} tweets`}
            </p>
            <p className="text-sm text-gray-400 max-w-xs">
              {isOver 
                ? `Release to move tweet to ${title.toLowerCase()}`
                : `Drag tweets here to mark them as ${title.toLowerCase()}`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export const TweetBoard: React.FC<TweetBoardProps> = ({ tweets, loading, onTweetUpdate, onTweetDelete }) => {
  const { user } = useAuth()
  const [regeneratingTweet, setRegeneratingTweet] = useState<string | null>(null)
  const [userPreferences, setUserPreferences] = useState<{ defaultTone?: string } | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedTweet, setSelectedTweet] = useState<Tweet | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // If dropping on a column, extract the status
    const targetStatus = overId.startsWith('column-') 
      ? overId.replace('column-', '') as Tweet['status']
      : tweets.find(t => t.id === overId)?.status

    if (!targetStatus) return

    const draggedTweet = tweets.find(t => t.id === activeId)
    if (!draggedTweet || draggedTweet.status === targetStatus) return

    // Update tweet status via drag and drop
    try {
      const { data, error } = await supabase
        .from('tweets')
        .update({ status: targetStatus })
        .eq('id', activeId)
        .select()
        .single()

      if (error) throw error

      onTweetUpdate(data)
      toast.success(`Tweet moved to ${statusConfig[targetStatus].title}`)
    } catch (error) {
      console.error('Error updating tweet status via drag:', error)
      toast.error('Failed to move tweet')
    }
  }, [tweets, onTweetUpdate])

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

  const handleTweetClick = useCallback((tweet: Tweet) => {
    setSelectedTweet(tweet)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedTweet(null)
  }, [])

  const handleRegenerateTweet = useCallback(async (tweet: Tweet, feedback: string) => {
    setRegeneratingTweet(tweet.id)
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
      const result = await generateTweets({
        idea: ideaData?.content || tweet.content,
        trainingExamples,
        regenerationFeedback: feedback,
        tone: userPreferences?.defaultTone || 'professional'
      })

      if (result.tweets.length > 0) {
        // Update the existing tweet with the first generated tweet
        const { data, error } = await supabase
          .from('tweets')
          .update({ 
            content: result.tweets[0].content,
            viral_score: result.tweets[0].viralScore,
            authenticity_score: result.tweets[0].scores.authenticity,
            engagement_score: result.tweets[0].scores.engagementPrediction,
            quality_score: result.tweets[0].scores.qualitySignals
          })
          .eq('id', tweet.id)
          .select()
          .single()

        if (error) throw error

        onTweetUpdate(data)
        
        if (result.scoringEnabled) {
          toast.success(`Tweet regenerated! Viral score: ${result.tweets[0].viralScore}/100`)
        } else {
          toast.success('Tweet regenerated successfully!')
        }
        
        // Update selected tweet if modal is open
        if (selectedTweet?.id === tweet.id) {
          setSelectedTweet(data)
        }
      }
    } catch (error) {
      console.error('Error regenerating tweet:', error)
      toast.error('Failed to regenerate tweet')
    } finally {
      setRegeneratingTweet(null)
    }
  }, [user?.id, userPreferences, onTweetUpdate, selectedTweet])

  const handleDeleteTweet = useCallback(async (tweetId: string) => {
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

  const handlePublishTweet = useCallback(async (tweetId: string) => {
    try {
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
      toast.success('Tweet published successfully!')
    } catch (error) {
      console.error('Error publishing tweet:', error)
      toast.error('Failed to publish tweet')
    }
  }, [onTweetUpdate])

  const getStatusTweets = useCallback((status: Tweet['status']) => {
    return tweets.filter(tweet => tweet.status === status)
  }, [tweets])

  const activeTweet = activeId ? tweets.find(t => t.id === activeId) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Tweet Management</h2>
              <p className="text-sm text-gray-600 mt-1">Click any card to view details • Drag cards to move between columns</p>
            </div>
            {regeneratingTweet && (
              <div className="flex items-center gap-2 text-indigo-600">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
                <span className="text-sm font-medium">Regenerating tweet...</span>
              </div>
            )}
          </div>
          
          {/* Kanban Grid */}
          <div className={`grid grid-cols-1 lg:grid-cols-4 gap-8 h-auto lg:h-[800px] transition-opacity duration-300 ${regeneratingTweet ? 'opacity-50' : 'opacity-100'}`}>
            {(Object.keys(statusConfig) as Array<Tweet['status']>).map((status) => {
              const config = statusConfig[status]
              const statusTweets = getStatusTweets(status)
              const Icon = config.icon

              return (
                <DroppableColumn
                  key={status}
                  status={status}
                  title={config.title}
                  count={statusTweets.length}
                  icon={Icon}
                >
                  <SortableContext
                    items={statusTweets.map(tweet => tweet.id)}
                    strategy={verticalListSortingStrategy}
                    id={`column-${status}`}
                  >
                    {statusTweets.map((tweet) => (
                      <DraggableTweetCard
                        key={tweet.id}
                        tweet={tweet}
                        onTweetClick={handleTweetClick}
                        onTweetDelete={handleDeleteTweet}
                      />
                    ))}
                  </SortableContext>
                </DroppableColumn>
              )
            })}
          </div>
          
          {/* Drag Overlay */}
          <DragOverlay>
            {activeTweet ? (
              <SimpleTweetCard
                tweet={activeTweet}
                onTweetClick={() => {}}
                onTweetDelete={handleDeleteTweet}
              />
            ) : null}
          </DragOverlay>
        </div>
      </DndContext>

      {/* Tweet Modal */}
      <TweetModal
        tweet={selectedTweet}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onRegenerateTweet={handleRegenerateTweet}
        onDeleteTweet={handleDeleteTweet}
        onPublishTweet={handlePublishTweet}
        isRegenerating={regeneratingTweet === selectedTweet?.id}
      />
    </>
  )
} 