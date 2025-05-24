'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/components/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { ensureUserExists } from '@/lib/user-utils'
import { formatDate } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface TrainingExample {
  id: string
  tweet_text: string
  created_at: string
}

export default function TrainingPage() {
  const { user } = useAuth()
  const [examples, setExamples] = useState<TrainingExample[]>([])
  const [newExample, setNewExample] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const fetchExamples = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('training_examples')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setExamples(data || [])
    } catch (error) {
      console.error('Error fetching examples:', error)
      toast.error('Failed to load training examples')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchExamples()
  }, [fetchExamples])

  const addExample = async () => {
    if (!newExample.trim()) return

    // Check if user already has 10 examples
    if (examples.length >= 10) {
      toast.error('Maximum of 10 training examples allowed')
      return
    }

    setAdding(true)
    try {
      // Ensure user exists before proceeding
      if (user) {
        await ensureUserExists(user.id, user.email, user.user_metadata?.name)
      }

      const { data, error } = await supabase
        .from('training_examples')
        .insert({
          user_id: user?.id,
          tweet_text: newExample.trim()
        })
        .select()
        .single()

      if (error) throw error

      setExamples(prev => [data, ...prev])
      setNewExample('')
      toast.success('Training example added successfully')
    } catch (error) {
      console.error('Error adding training example:', error)
      toast.error('Failed to add training example')
    } finally {
      setAdding(false)
    }
  }

  const deleteExample = async (id: string) => {
    try {
      const { error } = await supabase
        .from('training_examples')
        .delete()
        .eq('id', id)

      if (error) throw error

      setExamples(prev => prev.filter(example => example.id !== id))
      toast.success('Training example deleted')
    } catch (error) {
      console.error('Error deleting training example:', error)
      toast.error('Failed to delete training example')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Training Examples</h1>
          <p className="text-gray-600 mt-1">
            Add examples of your best tweets to train the agent on your writing style
          </p>
        </div>

        {/* Add new example */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Training Example</h2>
          <p className="text-sm text-gray-600 mb-4">
            Add examples of your writing style. These can be tweets, posts, or any content that represents how you communicate (up to 1000 characters). Maximum 10 examples.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Text
              </label>
              <div className="flex gap-2">
                <textarea
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  placeholder="Paste content that represents your writing style..."
                  className="input-field resize-none"
                  rows={4}
                  maxLength={1000}
                  disabled={adding}
                />
                <button
                  onClick={addExample}
                  disabled={!newExample.trim() || adding || examples.length >= 10}
                  className="btn-primary h-fit"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {newExample.length}/1000 characters
              </div>
            </div>
          </div>
        </div>

        {/* Examples list */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Training Examples ({examples.length}/10)
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
          ) : examples.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No training examples yet.</p>
              <p className="text-sm mt-1">Add some examples to help the agent learn your style!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {examples.map((example) => (
                <div
                  key={example.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-gray-900 flex-1 mr-4">
                      {example.tweet_text}
                    </p>
                    <button
                      onClick={() => deleteExample(example.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Added {formatDate(example.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {examples.length >= 10 && (
          <div className="card bg-amber-50 border-amber-200">
            <h3 className="font-medium text-amber-900 mb-2">📝 Training Complete</h3>
            <p className="text-sm text-amber-800">
              You&apos;ve reached the maximum of 10 training examples. This should be enough for the agent to learn your writing style effectively!
            </p>
          </div>
        )}

        {examples.length > 0 && examples.length < 10 && (
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">💡 Tips for Better Training</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Add 5-10 examples of your best content (tweets, posts, etc.)</li>
              <li>• Include content that represents different topics you write about</li>
              <li>• Make sure examples showcase your unique voice and style</li>
              <li>• Longer examples help the agent learn your communication patterns better</li>
              <li>• The agent will use these to match your tone and structure</li>
              <li>• Tweet about challenges you&apos;re facing and how you&apos;re solving them</li>
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 