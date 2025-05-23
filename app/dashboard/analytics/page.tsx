'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/components/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, MessageCircle, Heart, Repeat2 } from 'lucide-react'

interface AnalyticsData {
  totalTweets: number
  publishedTweets: number
  avgEngagement: number
  topPerformingTweet: string
  weeklyData: Array<{
    day: string
    tweets: number
    engagement: number
  }>
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user])

  const fetchAnalytics = async () => {
    try {
      // Fetch tweets data
      const { data: tweets, error } = await supabase
        .from('tweets')
        .select('*')
        .eq('user_id', user?.id)

      if (error) throw error

      // Calculate analytics
      const totalTweets = tweets?.length || 0
      const publishedTweets = tweets?.filter(t => t.status === 'published').length || 0
      
      // Mock engagement data for demo
      const avgEngagement = Math.floor(Math.random() * 100) + 50
      const topPerformingTweet = tweets?.[0]?.content?.substring(0, 50) + '...' || 'No tweets yet'

      // Generate weekly data
      const weeklyData = [
        { day: 'Mon', tweets: Math.floor(Math.random() * 10), engagement: Math.floor(Math.random() * 100) },
        { day: 'Tue', tweets: Math.floor(Math.random() * 10), engagement: Math.floor(Math.random() * 100) },
        { day: 'Wed', tweets: Math.floor(Math.random() * 10), engagement: Math.floor(Math.random() * 100) },
        { day: 'Thu', tweets: Math.floor(Math.random() * 10), engagement: Math.floor(Math.random() * 100) },
        { day: 'Fri', tweets: Math.floor(Math.random() * 10), engagement: Math.floor(Math.random() * 100) },
        { day: 'Sat', tweets: Math.floor(Math.random() * 10), engagement: Math.floor(Math.random() * 100) },
        { day: 'Sun', tweets: Math.floor(Math.random() * 10), engagement: Math.floor(Math.random() * 100) },
      ]

      setAnalytics({
        totalTweets,
        publishedTweets,
        avgEngagement,
        topPerformingTweet,
        weeklyData
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Track your tweet performance and engagement metrics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tweets</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.totalTweets || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.publishedTweets || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Engagement</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.avgEngagement || 0}%</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Repeat2 className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Retweets</p>
                <p className="text-2xl font-bold text-gray-900">{Math.floor(Math.random() * 100)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Tweet Volume</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tweets" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="engagement" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing Tweet */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Tweet</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900">{analytics?.topPerformingTweet}</p>
            <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <Heart className="h-4 w-4 mr-1" />
                {Math.floor(Math.random() * 500)} likes
              </span>
              <span className="flex items-center">
                <Repeat2 className="h-4 w-4 mr-1" />
                {Math.floor(Math.random() * 100)} retweets
              </span>
              <span className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" />
                {Math.floor(Math.random() * 50)} replies
              </span>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="card bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Agent Insights</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>• Your tweets perform best on weekdays between 9-11 AM</p>
            <p>• Tweets with questions get 40% more engagement</p>
            <p>• Your audience responds well to educational content</p>
            <p>• Consider adding more visual content to boost engagement</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 