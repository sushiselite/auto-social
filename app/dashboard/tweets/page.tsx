'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { TweetBoard } from '@/components/dashboard/TweetBoard'
import { useAuth } from '@/components/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, SortDesc, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

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

export default function TweetsPage() {
  const { user } = useAuth()
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sortBy, setSortBy] = useState<'created_at' | 'viral_score'>('created_at')

  const fetchTweets = useCallback(async () => {
    if (!user) return

    try {
      let query = supabase
        .from('tweets')
        .select('*')
        .eq('user_id', user.id)

      // Apply sorting
      if (sortBy === 'viral_score') {
        query = query.order('viral_score', { ascending: false, nullsFirst: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error

      setTweets(data || [])
    } catch (error) {
      console.error('Error fetching tweets:', error)
      toast.error('Failed to load tweets')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user, sortBy])

  useEffect(() => {
    fetchTweets()
  }, [fetchTweets])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchTweets()
  }

  const handleTweetUpdate = (updatedTweet: Tweet) => {
    setTweets(prev => 
      prev.map(tweet => 
        tweet.id === updatedTweet.id ? updatedTweet : tweet
      )
    )
  }

  const handleTweetDelete = (tweetId: string) => {
    setTweets(prev => prev.filter(tweet => tweet.id !== tweetId))
  }

  const getTweetStats = () => {
    return {
      total: tweets.length,
      generated: tweets.filter(t => t.status === 'generated').length,
      inReview: tweets.filter(t => t.status === 'in_review').length,
      approved: tweets.filter(t => t.status === 'approved').length,
      published: tweets.filter(t => t.status === 'published').length,
    }
  }

  const stats = getTweetStats()

  return (
    <DashboardLayout
      title="Tweet Board"
      subtitle="Manage your tweets through their lifecycle with drag & drop"
      actions={
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="btn-ghost btn-sm flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary btn-sm flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Tweets</div>
          </div>
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-900">{stats.generated}</div>
            <div className="text-sm text-blue-700">Generated</div>
          </div>
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-900">{stats.inReview}</div>
            <div className="text-sm text-yellow-700">In Review</div>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-900">{stats.approved}</div>
            <div className="text-sm text-green-700">Approved</div>
          </div>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.published}</div>
            <div className="text-sm text-gray-700">Published</div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <SortDesc className="h-4 w-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'created_at' | 'viral_score')}
                className="border border-gray-300 rounded-md px-3 py-1 pr-8 text-sm min-w-[140px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="created_at">Recent First</option>
                <option value="viral_score">Viral Score</option>
              </select>
            </div>

            <Link
              href="/dashboard"
              className="btn-primary btn-sm flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Create Tweet
            </Link>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <TweetBoard
            tweets={tweets}
            loading={loading}
            onTweetUpdate={handleTweetUpdate}
            onTweetDelete={handleTweetDelete}
          />
        </div>
      </div>
    </DashboardLayout>
  )
} 