'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { TweetBoard } from '@/components/dashboard/TweetBoard'
import { IdeaCapture } from '@/components/dashboard/IdeaCapture'
import { ApiStatus } from '@/components/dashboard/ApiStatus'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchTweets()
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

  const handleTweetUpdate = (updatedTweet: Tweet) => {
    setTweets(prev => 
      prev.map(tweet => 
        tweet.id === updatedTweet.id ? updatedTweet : tweet
      )
    )
  }

  const handleNewTweets = (newTweets: Tweet[]) => {
    setTweets(prev => [...newTweets, ...prev])
  }

  const handleTweetDelete = (tweetId: string) => {
    setTweets(prev => prev.filter(tweet => tweet.id !== tweetId))
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage your agent-generated tweets and social media content
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <IdeaCapture onNewTweets={handleNewTweets} />
          </div>
          <div className="lg:col-span-1">
            <ApiStatus />
          </div>
        </div>

        <TweetBoard 
          tweets={tweets}
          loading={loadingTweets}
          onTweetUpdate={handleTweetUpdate}
          onTweetDelete={handleTweetDelete}
        />
      </div>
    </DashboardLayout>
  )
} 