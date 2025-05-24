'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/components/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { ensureUserExists } from '@/lib/user-utils'
import { Save, User, Bell, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user } = useAuth()
  const [username, setUsername] = useState('')
  const [settings, setSettings] = useState({
    notifications: true,
    autoSchedule: false,
    timezone: 'UTC',
    defaultTone: 'professional'
  })
  const [loading, setLoading] = useState(true)

  const loadUserData = useCallback(async () => {
    if (!user) return

    try {
      // Ensure user exists
      await ensureUserExists(user.id, user.email, user.user_metadata?.name)

      // Load username and preferences from database
      const { data, error } = await supabase
        .from('users')
        .select('username, preferences')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        setUsername(data.username || '')
        if (data.preferences) {
          setSettings(prev => ({
            ...prev,
            ...data.preferences
          }))
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      toast.error('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Update username and preferences in database
      const { error } = await supabase
        .from('users')
        .update({ 
          username: username.trim() || user.email,
          preferences: settings
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const clearTrainingData = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('training_examples')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Training data cleared successfully')
    } catch (error) {
      console.error('Error clearing training data:', error)
      toast.error('Failed to clear training data')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account preferences and agent settings
          </p>
        </div>

        {/* Profile Settings */}
        <div className="card">
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input-field bg-gray-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Bell className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-600">Get notified when tweets are published</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => setSettings(prev => ({ ...prev, notifications: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Auto Schedule</h3>
                <p className="text-sm text-gray-600">Automatically schedule approved tweets</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoSchedule}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoSchedule: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Agent Settings */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Shield className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Agent Preferences</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Tone
              </label>
              <select
                value={settings.defaultTone}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultTone: e.target.value }))}
                className="input-field"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="humorous">Humorous</option>
                <option value="educational">Educational</option>
                <option value="inspirational">Inspirational</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                className="input-field"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="card border-red-200 bg-red-50">
          <h3 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-900">Clear Training Data</h4>
                <p className="text-sm text-red-700">Remove all training examples and reset agent learning</p>
              </div>
              <button 
                onClick={clearTrainingData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear Data
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-900">Delete Account</h4>
                <p className="text-sm text-red-700">Permanently delete your account and all data</p>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 