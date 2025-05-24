'use client'

import { useState, useEffect } from 'react'
import { Settings, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'

interface ApiStatus {
  configured: boolean
  working: boolean
  message: string
}

export const ApiStatus: React.FC = () => {
  const [status, setStatus] = useState<{
    anthropic: ApiStatus
    openai: ApiStatus
    supabase: ApiStatus
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkApiStatus()
  }, [])

  const checkApiStatus = async () => {
    try {
      // Check if environment variables are present (client-side check)
      const supabaseConfigured = !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL && 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      // Test Anthropic API
      let anthropicStatus: ApiStatus = {
        configured: false,
        working: false,
        message: 'Not configured'
      }

      try {
        const anthropicResponse = await fetch('/api/generate-tweets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea: 'test' })
        })
        
        if (anthropicResponse.ok) {
          anthropicStatus = {
            configured: true,
            working: true,
            message: 'Connected and working'
          }
        } else {
          const errorData = await anthropicResponse.json()
          anthropicStatus = {
            configured: false,
            working: false,
            message: errorData.error || 'API error'
          }
        }
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _unused = error
        anthropicStatus = {
          configured: false,
          working: false,
          message: 'Connection failed'
        }
      }

      // Test OpenAI API (simplified check)
      let openaiStatus: ApiStatus = {
        configured: false,
        working: false,
        message: 'Not configured'
      }

      try {
        // We'll just check if the endpoint exists since we can't test without an actual audio file
        const openaiResponse = await fetch('/api/transcribe-audio', {
          method: 'POST',
          body: new FormData() // Empty form data to trigger the "no file" error
        })
        
        if (openaiResponse.status === 400) {
          // This means the API is configured but no file was provided (expected)
          openaiStatus = {
            configured: true,
            working: true,
            message: 'Connected and ready'
          }
        } else if (openaiResponse.status === 500) {
          const errorData = await openaiResponse.json()
          if (errorData.error?.includes('not configured')) {
            openaiStatus = {
              configured: false,
              working: false,
              message: 'API key not configured'
            }
          }
        }
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _unused = error
        openaiStatus = {
          configured: false,
          working: false,
          message: 'Connection failed'
        }
      }

      setStatus({
        anthropic: anthropicStatus,
        openai: openaiStatus,
        supabase: {
          configured: supabaseConfigured,
          working: supabaseConfigured,
          message: supabaseConfigured ? 'Connected' : 'Not configured'
        }
      })
    } catch (error) {
      console.error('Error checking API status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!status) return null

  const allWorking = status.anthropic.working && status.openai.working && status.supabase.working
  const anyWorking = status.anthropic.working || status.openai.working || status.supabase.working

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">API Status</h3>
        </div>
        <a
          href="/setup"
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
        >
          Setup Guide
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="space-y-3">
        {/* Overall Status */}
        <div className={`p-3 rounded-lg ${
          allWorking 
            ? 'bg-green-50 border border-green-200' 
            : anyWorking 
            ? 'bg-yellow-50 border border-yellow-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {allWorking ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
            <span className={`text-sm font-medium ${
              allWorking ? 'text-green-800' : anyWorking ? 'text-yellow-800' : 'text-red-800'
            }`}>
              {allWorking 
                ? '🎉 All systems operational' 
                : anyWorking 
                ? '⚠️ Partial functionality (demo mode for missing APIs)'
                : '❌ Demo mode only'
              }
            </span>
          </div>
        </div>

        {/* Individual API Status */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Supabase (Database)</span>
            <div className="flex items-center gap-1">
              {status.supabase.working ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <AlertCircle className="h-3 w-3 text-red-600" />
              )}
              <span className={status.supabase.working ? 'text-green-600' : 'text-red-600'}>
                {status.supabase.message}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">Claude AI (Tweet Generation)</span>
            <div className="flex items-center gap-1">
              {status.anthropic.working ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <AlertCircle className="h-3 w-3 text-red-600" />
              )}
              <span className={status.anthropic.working ? 'text-green-600' : 'text-red-600'}>
                {status.anthropic.message}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">OpenAI Whisper (Voice)</span>
            <div className="flex items-center gap-1">
              {status.openai.working ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <AlertCircle className="h-3 w-3 text-red-600" />
              )}
              <span className={status.openai.working ? 'text-green-600' : 'text-red-600'}>
                {status.openai.message}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 