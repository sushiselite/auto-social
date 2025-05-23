'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/components/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { generateTweets } from '@/lib/ai-client'
import { Wand2, Calendar, Send, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreatePage() {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [scheduledTime, setScheduledTime] = useState('')
  const [tone, setTone] = useState('professional')

  const generateSuggestions = async () => {
    if (!content.trim()) return

    setIsGenerating(true)
    try {
      // Get user's training examples
      const { data: trainingData } = await supabase
        .from('training_examples')
        .select('tweet_text')
        .eq('user_id', user?.id)

      const trainingExamples = trainingData?.map(example => example.tweet_text) || []
      
      // Generate tweet suggestions
      const generatedTweets = await generateTweets({
        idea: content,
        trainingExamples,
        tone
      })
      
      setSuggestions(generatedTweets)
      toast.success(`Generated ${generatedTweets.length} suggestions!`)
    } catch (error) {
      console.error('Error generating suggestions:', error)
      toast.error('Failed to generate suggestions')
    } finally {
      setIsGenerating(false)
    }
  }

  const saveTweet = async (tweetContent: string, status: 'generated' | 'approved' = 'generated') => {
    try {
      // Save the original idea
      const { data: ideaData, error: ideaError } = await supabase
        .from('ideas')
        .insert({
          user_id: user?.id,
          content: content,
          type: 'text'
        })
        .select()
        .single()

      if (ideaError) throw ideaError

      // Save the tweet
      const { data: tweetData, error: tweetError } = await supabase
        .from('tweets')
        .insert({
          user_id: user?.id,
          idea_id: ideaData.id,
          content: tweetContent,
          status,
          scheduled_time: scheduledTime || null
        })
        .select()
        .single()

      if (tweetError) throw tweetError

      toast.success('Tweet saved successfully!')
      
      // Reset form
      setContent('')
      setSuggestions([])
      setScheduledTime('')
    } catch (error) {
      console.error('Error saving tweet:', error)
      toast.error('Failed to save tweet')
    }
  }

  const scheduleForLater = () => {
    // Set default to 1 hour from now
    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000)
    const formattedTime = oneHourLater.toISOString().slice(0, 16)
    setScheduledTime(formattedTime)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Tweet</h1>
          <p className="text-gray-600 mt-1">
            Craft your tweet manually with agent assistance
          </p>
        </div>

        {/* Main Creation Form */}
        <div className="card">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tweet Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind? Write your tweet or idea here..."
                className="input-field resize-none"
                rows={4}
                maxLength={280}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {content.length}/280 characters
                </span>
                <div className="flex gap-2">
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="humorous">Humorous</option>
                    <option value="educational">Educational</option>
                    <option value="inspirational">Inspirational</option>
                  </select>
                  <button
                    onClick={generateSuggestions}
                    disabled={!content.trim() || isGenerating}
                    className="btn-secondary text-xs flex items-center gap-1"
                  >
                    <Wand2 className="h-3 w-3" />
                    {isGenerating ? 'Generating...' : 'Agent Assist'}
                  </button>
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="input-field"
                />
                <button
                  onClick={scheduleForLater}
                  className="btn-secondary flex items-center gap-1"
                >
                  <Calendar className="h-4 w-4" />
                  +1 Hour
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => saveTweet(content, 'generated')}
                disabled={!content.trim()}
                className="btn-secondary flex items-center gap-1"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </button>
              <button
                onClick={() => saveTweet(content, 'approved')}
                disabled={!content.trim()}
                className="btn-primary flex items-center gap-1"
              >
                <Send className="h-4 w-4" />
                Save & Approve
              </button>
            </div>
          </div>
        </div>

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Agent Suggestions</h2>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <p className="text-sm text-gray-900 mb-3">{suggestion}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {suggestion.length}/280 characters
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setContent(suggestion)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Use This
                      </button>
                      <button
                        onClick={() => saveTweet(suggestion, 'generated')}
                        className="text-xs text-green-600 hover:text-green-800"
                      >
                        Save Draft
                      </button>
                      <button
                        onClick={() => saveTweet(suggestion, 'approved')}
                        className="text-xs text-purple-600 hover:text-purple-800"
                      >
                        Save & Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">💡 Writing Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Keep it under 280 characters for maximum engagement</li>
            <li>• Ask questions to encourage replies and interaction</li>
            <li>• Use relevant hashtags to increase discoverability</li>
            <li>• Include a call-to-action when appropriate</li>
                          <li>• Use the agent assist to generate variations and improve your content</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
} 