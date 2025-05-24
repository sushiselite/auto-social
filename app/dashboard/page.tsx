'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { IdeaCapture } from '@/components/dashboard/IdeaCapture'
import { ApiStatus } from '@/components/dashboard/ApiStatus'
import { PageLoading } from '@/components/ui/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import { BarChart3, ArrowRight, Sparkles, TrendingUp, Clock, Zap } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalTweets: number
  generatedTweets: number
  inReviewTweets: number
  approvedTweets: number
  publishedTweets: number
}

interface RecentTweet {
  id: string
  content: string
  status: string
  created_at: string
  viral_score?: number
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalTweets: 0,
    generatedTweets: 0,
    inReviewTweets: 0,
    approvedTweets: 0,
    publishedTweets: 0
  })
  const [recentTweets, setRecentTweets] = useState<RecentTweet[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  const fetchStats = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('tweets')
        .select('status, created_at, content, viral_score, id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const tweets = data || []
      const stats: DashboardStats = {
        totalTweets: tweets.length,
        generatedTweets: tweets.filter(t => t.status === 'generated').length,
        inReviewTweets: tweets.filter(t => t.status === 'in_review').length,
        approvedTweets: tweets.filter(t => t.status === 'approved').length,
        publishedTweets: tweets.filter(t => t.status === 'published').length,
      }

      // Get recent tweets for the activity feed
      const recent = tweets.slice(0, 5).map(tweet => ({
        id: tweet.id,
        content: tweet.content.substring(0, 100) + (tweet.content.length > 100 ? '...' : ''),
        status: tweet.status,
        created_at: tweet.created_at,
        viral_score: tweet.viral_score
      }))

      setStats(stats)
      setRecentTweets(recent)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user, fetchStats])

  const handleNewTweets = () => {
    // Refresh stats when new tweets are created
    fetchStats()
    toast.success(`Generated new tweet!`)
  }

  if (loading || !user) {
    return <PageLoading message="Loading your dashboard..." />
  }

  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle="Create and manage your AI-powered social media content"
      actions={
        <Link href="/dashboard/tweets" className="btn-primary btn-md">
          <BarChart3 className="h-4 w-4" />
          View Tweet Board
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tweets</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalTweets}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {recentTweets.length > 0 ? `Last: ${formatRelativeTime(recentTweets[0].created_at)}` : 'No activity yet'}
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
                <p className="text-sm font-medium text-gray-600">In Pipeline</p>
                <p className="text-3xl font-bold text-gray-900">{stats.generatedTweets + stats.inReviewTweets + stats.approvedTweets}</p>
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Ready for review
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Viral Score</p>
                <p className="text-3xl font-bold text-gray-900">
                  {recentTweets.length > 0 
                    ? Math.round(recentTweets.filter(t => t.viral_score).reduce((sum, t) => sum + (t.viral_score || 0), 0) / recentTweets.filter(t => t.viral_score).length) || '-'
                    : '-'
                  }
                </p>
                <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {recentTweets.filter(t => t.viral_score).length > 0 ? 'Based on recent tweets' : 'Generate tweets to see scores'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left side - Tweet generation */}
          <div className="xl:col-span-2 space-y-6">
            <IdeaCapture onNewTweets={handleNewTweets} />
            
            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/dashboard/tweets"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors duration-200">
                      <BarChart3 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Tweet Board</h4>
                      <p className="text-sm text-gray-600">Manage tweet workflow</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors duration-200" />
                </Link>

                <Link
                  href="/dashboard/training"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors duration-200">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Train Agent</h4>
                      <p className="text-sm text-gray-600">Add training examples</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors duration-200" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right sidebar - Recent activity and API status */}
          <div className="xl:col-span-1 space-y-6">
            <ApiStatus />
            
            {/* Recent Activity */}
            {recentTweets.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <Link 
                    href="/dashboard/tweets"
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View all →
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentTweets.map((tweet) => (
                    <div key={tweet.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
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
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">
                            {formatRelativeTime(tweet.created_at)}
                          </p>
                          {tweet.viral_score && (
                            <span className="text-xs text-indigo-600 font-medium">
                              {tweet.viral_score}/100
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Getting Started Tips */}
            <div className="card bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <h3 className="text-lg font-semibold text-indigo-900 mb-4">🚀 Getting Started</h3>
              <div className="space-y-3 text-sm text-indigo-800">
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-indigo-600 mt-2"></div>
                  <p>Use voice or text to capture your ideas quickly</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-indigo-600 mt-2"></div>
                  <p>Train your agent with examples of your writing style</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-indigo-600 mt-2"></div>
                  <p>Use the Tweet Board to manage your content workflow</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-indigo-600 mt-2"></div>
                  <p>Higher viral scores indicate better content potential</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 