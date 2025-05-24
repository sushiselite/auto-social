'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { TweetBoard } from '@/components/dashboard/TweetBoard'
import { IdeaCapture } from '@/components/dashboard/IdeaCapture'
import { ApiStatus } from '@/components/dashboard/ApiStatus'
import { CardSkeleton, PageLoading } from '@/components/ui/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Plus, Sparkles, TrendingUp, Clock } from 'lucide-react'

interface Tweet {
  id: string
  content: string
  status: 'generated' | 'in_review' | 'approved' | 'published'
  created_at: string
  scheduled_time?: string
  performance?: any
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [loadingTweets, setLoadingTweets] = useState(true)
  const [stats, setStats] = useState({
    totalTweets: 0,
    publishedTweets: 0,
    scheduledTweets: 0,
    lastActivity: null as string | null
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchTweets(),
        fetchStats()
      ])
    }
  }, [user])

  const fetchTweets = async () => {
    try {
      const { data, error } = await supabase
        .from('tweets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTweets(data || [])
    } catch (error) {
      console.error('Error fetching tweets:', error)
      toast.error('Failed to load tweets')
    } finally {
      setLoadingTweets(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('tweets')
        .select('status, created_at')
        .eq('user_id', user?.id)

      if (error) throw error

      const totalTweets = data?.length || 0
      const publishedTweets = data?.filter(t => t.status === 'published').length || 0
      const scheduledTweets = data?.filter(t => t.status === 'approved').length || 0
      const lastActivity = data?.[0]?.created_at || null

      setStats({
        totalTweets,
        publishedTweets,
        scheduledTweets,
        lastActivity
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleTweetUpdate = (updatedTweet: Tweet) => {
    setTweets(prev => 
      prev.map(tweet => 
        tweet.id === updatedTweet.id ? updatedTweet : tweet
      )
    )
    // Refetch stats when tweets are updated
    fetchStats()
  }

  const handleNewTweets = (newTweets: Tweet[]) => {
    setTweets(prev => [...newTweets, ...prev])
    // Refetch stats when new tweets are added
    fetchStats()
  }

  const handleTweetDelete = (tweetId: string) => {
    setTweets(prev => prev.filter(tweet => tweet.id !== tweetId))
    // Refetch stats when tweets are deleted
    fetchStats()
  }

  if (loading || !user) {
    return <PageLoading message="Loading your dashboard..." />
  }

  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle="Manage your agent-generated tweets and social media content"
      actions={
        <button className="btn-primary btn-md">
          <Plus className="h-4 w-4" />
          New Campaign
        </button>
      }
    >
      <div className="space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tweets</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalTweets}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.lastActivity ? `Last: ${formatRelativeTime(stats.lastActivity)}` : 'No activity yet'}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-3xl font-bold text-gray-900">{stats.publishedTweets}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Live content
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-3xl font-bold text-gray-900">{stats.scheduledTweets}</p>
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Ready to publish
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left side - Tweet generation and management */}
          <div className="xl:col-span-3 space-y-6">
            <IdeaCapture onNewTweets={handleNewTweets} />
            
            {loadingTweets ? (
              <div className="space-y-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : (
              <TweetBoard 
                tweets={tweets}
                loading={loadingTweets}
                onTweetUpdate={handleTweetUpdate}
                onTweetDelete={handleTweetDelete}
              />
            )}
          </div>

          {/* Right sidebar - API status and quick actions */}
          <div className="xl:col-span-1 space-y-6">
            <ApiStatus />
            
            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/dashboard/training')}
                  className="w-full btn-secondary btn-sm justify-start"
                >
                  <Sparkles className="h-4 w-4" />
                  Train Your Agent
                </button>
                <button 
                  onClick={() => router.push('/dashboard/analytics')}
                  className="w-full btn-secondary btn-sm justify-start"
                >
                  <TrendingUp className="h-4 w-4" />
                  View Analytics
                </button>
                <button 
                  onClick={() => router.push('/dashboard/settings')}
                  className="w-full btn-secondary btn-sm justify-start"
                >
                  ⚙️ Settings
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            {tweets.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {tweets.slice(0, 3).map((tweet) => (
                    <div key={tweet.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        tweet.status === 'published' ? 'bg-green-400' :
                        tweet.status === 'approved' ? 'bg-orange-400' :
                        tweet.status === 'in_review' ? 'bg-yellow-400' :
                        'bg-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {tweet.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(tweet.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 