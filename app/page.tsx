'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Mic, Zap, Sparkles, Bot, BarChart3 } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="animate-spin rounded-full h-32 w-32 border-4 border-white/30 border-t-white"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="px-6 py-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Tweetalytics</span>
            </div>
            <div className="flex items-center space-x-6">
              <a
                href="/docs"
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                Documentation
              </a>
              <a
                href="/setup"
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                Setup Guide
              </a>
            </div>
          </div>
        </nav>

        <div className="px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Left side - Hero content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6">
                  <Zap className="w-4 h-4 mr-2" />
                  AI-Powered Tweet Optimization
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                  Think It.
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Tweet It.
                  </span>
                  <br />
                  Scale It.
                </h1>
                
                <p className="text-xl text-white/80 mb-8 max-w-lg">
                  Transform your ideas into viral tweets with AI scoring. No guesswork, no stress, just data-driven content optimization.
                </p>

                {/* Features grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Mic className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Voice to Tweet</h3>
                      <p className="text-white/60 text-sm">Record, transcribe, optimize</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Viral Scoring</h3>
                      <p className="text-white/60 text-sm">AI-powered optimization</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Performance Tracking</h3>
                      <p className="text-white/60 text-sm">Monitor and improve</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Smart Publishing</h3>
                      <p className="text-white/60 text-sm">Schedule & automate</p>
                    </div>
                  </div>
                </div>
                
                {/* Documentation callout */}
                <div className="text-center mt-6">
                  <a 
                    href="/docs"
                    className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors border-b border-white/30 hover:border-white/60 pb-1"
                  >
                    <span>📖</span>
                    Read the story behind Tweetalytics and learn how our viral scoring works
                  </a>
                </div>
              </div>

              {/* Right side - Auth form */}
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-md">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-white mb-2">Get Started</h2>
                      <p className="text-white/70">Join thousands transforming their social media</p>
                    </div>
                    
                    <Auth
                      supabaseClient={supabase}
                      view="sign_up"
                      appearance={{
                        theme: ThemeSupa,
                        variables: {
                          default: {
                            colors: {
                              brand: 'rgb(168, 85, 247)',
                              brandAccent: 'rgb(147, 51, 234)',
                              brandButtonText: 'white',
                              defaultButtonBackground: 'rgba(255, 255, 255, 0.1)',
                              defaultButtonBackgroundHover: 'rgba(255, 255, 255, 0.2)',
                              defaultButtonBorder: 'rgba(255, 255, 255, 0.2)',
                              defaultButtonText: 'white',
                              dividerBackground: 'rgba(255, 255, 255, 0.2)',
                              inputBackground: 'rgba(255, 255, 255, 0.1)',
                              inputBorder: 'rgba(255, 255, 255, 0.2)',
                              inputBorderHover: 'rgba(255, 255, 255, 0.4)',
                              inputBorderFocus: 'rgb(168, 85, 247)',
                              inputText: 'white',
                              inputPlaceholder: 'rgba(255, 255, 255, 0.6)',
                            },
                            space: {
                              spaceSmall: '4px',
                              spaceMedium: '8px',
                              spaceLarge: '16px',
                              labelBottomMargin: '8px',
                              anchorBottomMargin: '4px',
                              emailInputSpacing: '4px',
                              socialAuthSpacing: '4px',
                              buttonPadding: '10px 15px',
                              inputPadding: '10px 15px',
                            },
                            fontSizes: {
                              baseBodySize: '14px',
                              baseInputSize: '14px',
                              baseLabelSize: '14px',
                              baseButtonSize: '14px',
                            },
                            borderWidths: {
                              buttonBorderWidth: '1px',
                              inputBorderWidth: '1px',
                            },
                            radii: {
                              borderRadiusButton: '8px',
                              buttonBorderRadius: '8px',
                              inputBorderRadius: '8px',
                            },
                          },
                        },
                        className: {
                          container: 'auth-container',
                          button: 'auth-button',
                          input: 'auth-input',
                        },
                      }}
                      theme="dark"
                      providers={[]}
                      redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`}
                      showLinks={true}
                    />
                    
                    <div className="mt-6 text-center">
                      <p className="text-white/60 text-sm">
                        Start your free trial today
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="px-6 pb-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-4">Ready to optimize your tweets?</h3>
              <p className="text-white/70 mb-6">Join creators who&apos;ve generated viral content with our AI-powered scoring system</p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-white/60">
                <span>✨ No credit card required</span>
                <span>🚀 Setup in 2 minutes</span>
                <span>🎯 Data-driven optimization</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
} 