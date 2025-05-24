'use client'

import React, { useState } from 'react'
import { X, RotateCcw, Send, Trash2 } from 'lucide-react'
import { TweetScoreDisplay } from './TweetScoreDisplay'
import { formatDateTime } from '@/lib/utils'

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

interface TweetModalProps {
  tweet: Tweet | null
  isOpen: boolean
  onClose: () => void
  onRegenerateTweet?: (tweet: Tweet, feedback: string) => void
  onDeleteTweet?: (tweetId: string) => void
  onPublishTweet?: (tweetId: string) => void
  isRegenerating?: boolean
}

export const TweetModal: React.FC<TweetModalProps> = ({
  tweet,
  isOpen,
  onClose,
  onRegenerateTweet,
  onDeleteTweet,
  onPublishTweet,
  isRegenerating = false
}) => {
  const [regenerationFeedback, setRegenerationFeedback] = useState('')

  if (!isOpen || !tweet) return null

  const handleRegenerate = () => {
    if (onRegenerateTweet) {
      onRegenerateTweet(tweet, regenerationFeedback)
      setRegenerationFeedback('')
    }
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this tweet?')) {
      onDeleteTweet?.(tweet.id)
      onClose()
    }
  }

  const handlePublish = () => {
    onPublishTweet?.(tweet.id)
    onClose()
  }

  const formatTweetContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ))
  }

  const getStatusBadge = (status: string) => {
    const config = {
      generated: { color: 'bg-blue-100 text-blue-700', label: 'Generated' },
      in_review: { color: 'bg-yellow-100 text-yellow-700', label: 'In Review' },
      approved: { color: 'bg-green-100 text-green-700', label: 'Approved' },
      published: { color: 'bg-gray-100 text-gray-700', label: 'Published' }
    }
    const statusConfig = config[status as keyof typeof config] || config.generated
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
        {statusConfig.label}
      </span>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Tweet Details</h2>
            {getStatusBadge(tweet.status)}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Tweet Content */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Content</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {formatTweetContent(tweet.content)}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    {tweet.content.length} characters
                  </span>
                </div>
              </div>
            </div>

            {/* Viral Scores */}
            {tweet.viral_score && tweet.authenticity_score && tweet.engagement_score && tweet.quality_score && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Performance Scores</h3>
                <TweetScoreDisplay
                  viralScore={tweet.viral_score}
                  authenticity={tweet.authenticity_score}
                  engagement={tweet.engagement_score}
                  quality={tweet.quality_score}
                  compact={false}
                />
              </div>
            )}

            {/* Metadata */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Metadata</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900">{formatDateTime(tweet.created_at)}</span>
                </div>
                {tweet.scheduled_time && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Scheduled:</span>
                    <span className="text-gray-900">{formatDateTime(tweet.scheduled_time)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-gray-900 capitalize">{tweet.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Regeneration for Generated Tweets */}
            {tweet.status === 'generated' && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Regeneration</h3>
                <div className="space-y-3">
                  <textarea
                    value={regenerationFeedback}
                    onChange={(e) => setRegenerationFeedback(e.target.value)}
                    placeholder="Add feedback for regeneration (optional)..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    rows={3}
                  />
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200"
                  >
                    <RotateCcw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                    {isRegenerating ? 'Regenerating...' : 'Regenerate Tweet'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <Trash2 className="h-4 w-4" />
              Delete Tweet
            </button>

            <div className="flex gap-3">
              {tweet.status === 'approved' && (
                <button
                  onClick={handlePublish}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-all duration-200"
                >
                  <Send className="h-4 w-4" />
                  Publish Tweet
                </button>
              )}
              
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 