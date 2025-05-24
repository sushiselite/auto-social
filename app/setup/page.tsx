'use client'

import { useState } from 'react'
import { CheckCircle, Copy, ExternalLink, Key, Database, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function SetupPage() {
  const [copiedStep, setCopiedStep] = useState<string | null>(null)

  const copyToClipboard = (text: string, step: string) => {
    navigator.clipboard.writeText(text)
    setCopiedStep(step)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedStep(null), 2000)
  }

  const setupSteps = [
    {
      id: 'supabase',
      title: 'Set up Supabase',
      icon: Database,
      description: 'Create your Supabase project and database',
      steps: [
        'Go to https://supabase.com and create a new project',
        'Copy your project URL and anon key from Settings > API',
        'Run the SQL commands in the SQL Editor to create tables',
      ],
      sqlCommands: `-- Users table
CREATE TABLE users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Ideas table
CREATE TABLE ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  type TEXT CHECK (type IN ('text', 'voice')),
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Tweets table
CREATE TABLE tweets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  content TEXT,
  status TEXT CHECK (status IN ('generated', 'in_review', 'approved', 'published')) DEFAULT 'generated',
  scheduled_time TIMESTAMP WITH TIME ZONE,
  performance JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Training examples table
CREATE TABLE training_examples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tweet_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Tweet feedback table
CREATE TABLE tweet_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tweet_id UUID REFERENCES tweets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweet_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own ideas" ON ideas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tweets" ON tweets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own training examples" ON training_examples FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own feedback" ON tweet_feedback FOR ALL USING (auth.uid() = user_id);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`
    },
    {
      id: 'anthropic',
      title: 'Get Anthropic API Key',
      icon: Zap,
      description: 'Set up Claude AI for tweet generation',
      steps: [
        'Visit https://console.anthropic.com',
        'Create an account or sign in',
        'Go to API Keys section',
        'Create a new API key',
        'Copy the key (starts with "sk-ant-")'
      ]
    },
    {
      id: 'openai',
      title: 'Get OpenAI API Key',
      icon: Key,
      description: 'Set up Whisper for voice transcription',
      steps: [
        'Visit https://platform.openai.com',
        'Create an account or sign in',
        'Go to API Keys section',
        'Create a new secret key',
        'Copy the key (starts with "sk-")'
      ]
    }
  ]

  const envExample = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key

# App Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3001`

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Setup Tweetalytics
          </h1>
          <p className="text-xl text-gray-600">
            Get your AI-powered social media platform up and running in minutes
          </p>
        </div>

        <div className="space-y-8">
          {setupSteps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.id} className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center mb-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mr-4">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-primary-600 bg-primary-100 px-3 py-1 rounded-full mr-3">
                        Step {index + 1}
                      </span>
                      <h2 className="text-2xl font-bold text-gray-900">{step.title}</h2>
                    </div>
                    <p className="text-gray-600 mt-1">{step.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {step.steps.map((stepItem, stepIndex) => (
                    <div key={stepIndex} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{stepItem}</span>
                    </div>
                  ))}
                </div>

                {step.id === 'supabase' && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">SQL Commands</h3>
                      <button
                        onClick={() => copyToClipboard(step.sqlCommands!, 'sql')}
                        className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        {copiedStep === 'sql' ? 'Copied!' : 'Copy SQL'}
                      </button>
                    </div>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                      {step.sqlCommands}
                    </pre>
                  </div>
                )}

                {step.id === 'anthropic' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Claude API provides excellent content generation. 
                      You&apos;ll need to add credits to your account for production use.
                    </p>
                  </div>
                )}

                {step.id === 'openai' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Whisper API is very cost-effective for transcription. 
                      Most voice memos will cost less than $0.01 to transcribe.
                    </p>
                  </div>
                )}
              </div>
            )
          })}

          {/* Environment Variables */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mr-4">
                <Key className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Environment Variables</h2>
                <p className="text-gray-600 mt-1">Add these to your .env.local file</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">.env.local</h3>
                <button
                  onClick={() => copyToClipboard(envExample, 'env')}
                  className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copiedStep === 'env' ? 'Copied!' : 'Copy Template'}
                </button>
              </div>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                {envExample}
              </pre>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Never commit your .env.local file to version control. 
                It contains sensitive API keys that should be kept private.
              </p>
            </div>
          </div>

          {/* Final Steps */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You&apos;re Almost Done!</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">
                  Create a <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> file in your project root
                </span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Add all the environment variables with your actual keys</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Restart your development server</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Start creating amazing content with AI!</span>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Go to Dashboard
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 