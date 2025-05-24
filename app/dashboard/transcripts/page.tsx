'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PageLoading } from '@/components/ui/LoadingSpinner'
import { TranscriptWizard } from '@/components/dashboard'
import { supabase } from '@/lib/supabase'
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface Transcript {
  id: string
  title: string
  content: string
  content_type: string
  character_count: number
  status: 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export default function TranscriptsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [loadingTranscripts, setLoadingTranscripts] = useState(true)
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  const fetchTranscripts = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('transcripts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTranscripts(data || [])
    } catch (error) {
      console.error('Error fetching transcripts:', error)
    } finally {
      setLoadingTranscripts(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchTranscripts()
    }
  }, [user, fetchTranscripts])

  const handleWizardComplete = () => {
    setShowWizard(false)
    fetchTranscripts()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'processing':
        return 'Processing'
      case 'failed':
        return 'Failed'
      default:
        return 'Unknown'
    }
  }

  if (loading || !user) {
    return <PageLoading message="Loading transcripts..." />
  }

  if (showWizard) {
    return (
      <DashboardLayout title="Create from Transcript" subtitle="Transform long-form content into engaging tweets">
        <TranscriptWizard onComplete={handleWizardComplete} onCancel={() => setShowWizard(false)} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title="Long-Form Content" 
      subtitle="Transform transcripts and long-form content into engaging tweets"
      actions={
        <button 
          onClick={() => setShowWizard(true)}
          className="btn-primary btn-md"
        >
          <FileText className="h-4 w-4" />
          New Transcript
        </button>
      }
    >
      <div className="space-y-6">
        {/* How It Works */}
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How Long-Form to Tweet Conversion Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">1</div>
                  <div>
                    <p className="font-medium text-gray-900">Input Transcript</p>
                    <p className="text-gray-600">Paste your transcript or long-form content (500-50,000 characters)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">2</div>
                  <div>
                    <p className="font-medium text-gray-900">Extract Insights</p>
                    <p className="text-gray-600">AI identifies 3-5 key insights with speaker attribution</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">3</div>
                  <div>
                    <p className="font-medium text-gray-900">Refine & Select</p>
                    <p className="text-gray-600">Edit insights and choose which ones to convert to tweets</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">4</div>
                  <div>
                    <p className="font-medium text-gray-900">Generate Tweets</p>
                    <p className="text-gray-600">AI creates optimized tweets using your selected content mode</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transcripts */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transcripts</h3>
            {transcripts.length > 0 && (
              <span className="text-sm text-gray-500">{transcripts.length} total</span>
            )}
          </div>

          {loadingTranscripts ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : transcripts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No transcripts yet</h4>
              <p className="text-gray-600 mb-6">
                Start by creating your first transcript to extract insights and generate tweets from long-form content.
              </p>
              <button 
                onClick={() => setShowWizard(true)}
                className="btn-primary"
              >
                <FileText className="h-4 w-4" />
                Create Your First Transcript
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {transcripts.map((transcript) => (
                <div 
                  key={transcript.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(transcript.status)}
                        <h4 className="font-medium text-gray-900">{transcript.title}</h4>
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                          {transcript.content_type.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Status:</span> {getStatusLabel(transcript.status)}
                        </div>
                        <div>
                          <span className="font-medium">Length:</span> {transcript.character_count.toLocaleString()} chars
                        </div>
                        <div>
                          <span className="font-medium">Created:</span> {formatRelativeTime(transcript.created_at)}
                        </div>
                        <div>
                          <span className="font-medium">Updated:</span> {formatRelativeTime(transcript.updated_at)}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2">
                        {transcript.content.substring(0, 200)}...
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {transcript.status === 'failed' && (
                        <button 
                          onClick={() => {/* TODO: Add retry functionality */}}
                          className="btn-secondary btn-sm"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
} 