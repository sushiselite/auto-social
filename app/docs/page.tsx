'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { ArrowLeft, Twitter, Linkedin, Zap, Target, Users, Star, TrendingUp, Brain, Database, BarChart3 } from 'lucide-react'

const DocsPage = () => {
  const [activeSection, setActiveSection] = useState('story')

  const sections = useMemo(() => [
    { id: 'story', title: 'The Story Behind Tweetalytics', icon: '📖' },
    { id: 'inspiration', title: 'From Zero to Viral', icon: '🚀' },
    { id: 'data-driven', title: 'A Data-Driven Approach', icon: '📊' },
    { id: 'multimodal', title: 'Multi-Modal Content Strategy', icon: '🎯' },
    { id: 'scoring', title: 'The Viral Scoring System', icon: '⚡' },
    { id: 'tweepcreed', title: 'Inspired by TweepCreed', icon: '🔬' },
    { id: 'algorithm', title: 'Gaming the Algorithm', icon: '🎮' },
    { id: 'future', title: 'What&apos;s Next', icon: '🔮' }
  ], [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100
      
      for (const section of sections) {
        const element = document.getElementById(section.id)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sections])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <Head>
        <title>The Science of Going Viral - Tweetalytics Documentation</title>
        <meta name="description" content="Learn how a tech founder built a data-driven approach to social media growth, going from zero to thousands of followers in just two months using Tweetalytics&apos; viral scoring system." />
        <meta name="keywords" content="social media growth, viral content, twitter growth, linkedin growth, data-driven marketing, social media automation, viral scoring, tweepcreed" />
        <meta property="og:title" content="The Science of Going Viral - Tweetalytics Documentation" />
        <meta property="og:description" content="Learn the story behind Tweetalytics and how our viral scoring system helps creators optimize their content for maximum engagement." />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="The Science of Going Viral - Tweetalytics Documentation" />
        <meta name="twitter:description" content="Learn the story behind Tweetalytics and how our viral scoring system helps creators optimize their content for maximum engagement." />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to App</span>
              </Link>
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-purple-600" />
                <span className="font-bold text-xl text-gray-900">Tweetalytics</span>
                <span className="text-sm text-gray-500">Documentation</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Left Sidebar Navigation */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <nav className="space-y-2">
                  <h3 className="font-semibold text-gray-900 mb-4">Contents</h3>
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeSection === section.id
                          ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-500'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mr-2">{section.icon}</span>
                      {section.title}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-4xl">
              <article className="prose prose-lg max-w-none">
                
                {/* Hero Section */}
                <div className="text-center mb-16">
                  <h1 className="text-5xl font-bold text-gray-900 mb-6">
                    The Science of Going Viral
                  </h1>
                  <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                    How a tech founder built a data-driven approach to social media growth, 
                    going from zero to thousands of followers in just two months.
                  </p>
                  <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" />
                      <span>1,000+ X followers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" />
                      <span>2,000+ LinkedIn connections</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>500,000+ impressions</span>
                    </div>
                  </div>
                </div>

                {/* Story Section */}
                <section id="story" className="mb-16">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    📖 The Story Behind Tweetalytics
                  </h2>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-2xl border border-gray-200 mb-8">
                    <p className="text-lg text-gray-700 leading-relaxed mb-4">
                      Two months ago, I was just another person with virtually no social media presence. 
                      Zero followers on X (Twitter), minimal LinkedIn activity, and honestly, no clue about the 
                      intricacies of social media growth.
                    </p>
                    <p className="text-lg text-gray-700 leading-relaxed">
                      Fast forward to today: over 1,000 followers on X, 2,000+ on LinkedIn, 500,000+ impressions 
                      across platforms, hundreds of genuine DMs, and most importantly, a deeper understanding of what 
                      makes content go viral. This transformation didn&apos;t happen by accident—it was the result of 
                      mentorship, experimentation, and an obsession with data.
                    </p>
                  </div>
                </section>

                {/* Inspiration Section */}
                <section id="inspiration" className="mb-16">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    🚀 From Zero to Viral
                  </h2>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    The journey began when my friend <strong>Austin</strong> introduced me to the world of 
                    strategic social media. Austin is experienced in understanding the psychology behind 
                    viral content, platform algorithms, and authentic engagement strategies.
                  </p>
                  
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8">
                    <h3 className="font-semibold text-gray-900 mb-2">🙏 A Special Thanks</h3>
                    <p className="text-gray-700">
                      <em>Austin, if you&apos;re reading this—thank you for opening my eyes to this incredible 
                      space. Your insights about authentic storytelling, community building, and platform 
                      dynamics were the catalyst for everything that followed. This app exists because 
                      you showed me that social media growth isn&apos;t magic—it&apos;s a skill that can be learned, 
                      measured, and optimized.</em>
                    </p>
                  </div>

                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    Under Austin&apos;s guidance, I learned the fundamentals: how to craft compelling narratives, 
                    when to post for maximum engagement, which content formats perform best, and most 
                    importantly, how to build genuine connections with an audience.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <Twitter className="h-8 w-8 text-blue-500 mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">X (Twitter) Growth</h3>
                      <p className="text-3xl font-bold text-blue-600 mb-2">0 → 1,000+</p>
                      <p className="text-sm text-gray-600">Followers in 2 months through strategic content and engagement</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <Linkedin className="h-8 w-8 text-blue-700 mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">LinkedIn Growth</h3>
                      <p className="text-3xl font-bold text-blue-700 mb-2">0 → 2,000+</p>
                      <p className="text-sm text-gray-600">Professional connections through thought leadership</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <BarChart3 className="h-8 w-8 text-green-600 mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Total Impressions</h3>
                      <p className="text-3xl font-bold text-green-600 mb-2">500,000+</p>
                      <p className="text-sm text-gray-600">Cross-platform reach and content visibility</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <Users className="h-8 w-8 text-purple-600 mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Genuine Engagement</h3>
                      <p className="text-3xl font-bold text-purple-600 mb-2">Hundreds</p>
                      <p className="text-sm text-gray-600">Real DMs and meaningful conversations started</p>
                    </div>
                  </div>
                </section>

                {/* Data-Driven Section */}
                <section id="data-driven" className="mb-16">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    📊 A Data-Driven Approach
                  </h2>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    I like to learn new things and this is my latest side obsession: <em>What if we could scientifically 
                    analyze what makes content go viral?</em> While Austin taught me the art of social 
                    media, my analytical mind craved the science behind it.
                  </p>
                  
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    That&apos;s when I discovered the concept of algorithmic optimization for social platforms. 
                    The idea wasn&apos;t to manipulate or spam, but to understand the underlying patterns that 
                    platforms reward and create authentically engaging content that aligns with these patterns.
                  </p>

                  <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">The Hypothesis</h3>
                    <p className="text-gray-700 leading-relaxed">
                      <strong>If viral content follows predictable patterns, then we can build a system 
                      that identifies these patterns and helps creators optimize their content before publishing.</strong>
                    </p>
                  </div>

                  <p className="text-lg text-gray-700 leading-relaxed">
                    This hypothesis led to the creation of Tweetalytics—a platform that combines the 
                    human intuition Austin taught me with the analytical power of data science and AI.
                  </p>
                </section>

                {/* Multi-Modal Section */}
                <section id="multimodal" className="mb-16">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    🎯 Multi-Modal Content Strategy
                  </h2>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    One of the key insights from my journey was that different types of content serve 
                    different purposes. Tweetalytics is built around four distinct content modes, each 
                    optimized for specific outcomes:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <Brain className="h-8 w-8 text-purple-600 mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Thought Leadership</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Establish authority and expertise in your field. Perfect for sharing industry 
                        insights, predictions, and professional opinions that position you as a credible voice.
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <Users className="h-8 w-8 text-green-600 mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Community Engagement</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Foster discussions and build relationships. Content designed to encourage 
                        responses, spark debates, and create meaningful connections with your audience.
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <Target className="h-8 w-8 text-blue-600 mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Personal Brand</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Share your unique story and perspective. Authentic, personal content that 
                        helps your audience connect with you as a human being, not just a professional.
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <Star className="h-8 w-8 text-yellow-600 mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Value-First</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Provide immediate, actionable value. Tips, insights, and knowledge that your 
                        audience can implement right away, building trust through helpfulness.
                      </p>
                    </div>
                  </div>

                  <p className="text-lg text-gray-700 leading-relaxed">
                    Each mode has its own optimization parameters, scoring criteria, and strategic 
                    purpose. The app analyzes your content against the specific goals of your chosen 
                    mode, ensuring maximum effectiveness.
                  </p>
                </section>

                {/* Scoring System Section */}
                <section id="scoring" className="mb-16">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    ⚡ The Viral Scoring System
                  </h2>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    At the heart of Tweetalytics lies our proprietary viral scoring algorithm. This 
                    system evaluates content across three critical dimensions, each weighted based 
                    on its impact on viral potential:
                  </p>

                  <div className="space-y-6 mb-8">
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3 mb-3">
                        <Target className="h-6 w-6 text-blue-600" />
                        <h3 className="text-xl font-semibold text-gray-900">Authenticity Score (40% weight)</h3>
                      </div>
                      <p className="text-gray-700 mb-3">
                        Measures how human and genuine your content feels. Algorithms increasingly 
                        favor authentic voices over corporate speak or AI-generated content.
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Personal voice and emotional expression</li>
                        <li>• Natural language patterns and conversational tone</li>
                        <li>• Avoidance of AI-typical phrases and corporate jargon</li>
                        <li>• Vulnerability and honest storytelling</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                      <div className="flex items-center gap-3 mb-3">
                        <Users className="h-6 w-6 text-green-600" />
                        <h3 className="text-xl font-semibold text-gray-900">Engagement Prediction (35% weight)</h3>
                      </div>
                      <p className="text-gray-700 mb-3">
                        Analyzes elements that historically drive comments, shares, and saves. 
                        Content that sparks conversation gets broader reach.
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Question patterns and call-to-action elements</li>
                        <li>• Relatability and broad appeal factors</li>
                        <li>• Opinion statements that spark discussion</li>
                        <li>• Educational value and shareability</li>
                      </ul>
                    </div>

                    <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                      <div className="flex items-center gap-3 mb-3">
                        <Star className="h-6 w-6 text-purple-600" />
                        <h3 className="text-xl font-semibold text-gray-900">Quality Signals (25% weight)</h3>
                      </div>
                      <p className="text-gray-700 mb-3">
                        Evaluates readability, clarity, and information density. Well-crafted 
                        content performs better across all metrics.
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Optimal length and readability balance</li>
                        <li>• Information density and value per character</li>
                        <li>• Grammar, structure, and flow</li>
                        <li>• Specificity versus vague language</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-gray-900 text-white p-8 rounded-2xl">
                    <h3 className="text-xl font-semibold mb-4">Scoring Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <div className="text-2xl font-bold text-green-400 mb-2">85-100</div>
                        <div className="text-sm text-gray-300">Exceptional viral potential</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-400 mb-2">65-84</div>
                        <div className="text-sm text-gray-300">Good viral potential</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-400 mb-2">45-64</div>
                        <div className="text-sm text-gray-300">Room for optimization</div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* TweepCreed Section */}
                <section id="tweepcreed" className="mb-16">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    🔬 Inspired by TweepCreed
                  </h2>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    Tweetalytics&apos; scoring methodology draws inspiration from TweepCreed, a pioneering 
                    platform that demonstrated the viability of algorithmic social media analysis. 
                    TweepCreed showed us that viral content isn&apos;t random—it follows predictable patterns 
                    that can be identified and replicated.
                  </p>

                  <div className="bg-indigo-50 p-8 rounded-2xl border border-indigo-200 mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Building on the Foundation</h3>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      While TweepCreed focused primarily on engagement metrics and follower analysis, 
                      Tweetalytics extends this concept by incorporating:
                    </p>
                    <ul className="text-gray-700 space-y-2">
                      <li>• <strong>Multi-modal content strategy</strong> - Different scoring for different content types</li>
                      <li>• <strong>Authenticity detection</strong> - Prioritizing human voice over AI-generated content</li>
                      <li>• <strong>Real-time optimization</strong> - Feedback before publishing, not after</li>
                      <li>• <strong>Cross-platform insights</strong> - Principles that work across Twitter, LinkedIn, and beyond</li>
                    </ul>
                  </div>

                  <p className="text-lg text-gray-700 leading-relaxed">
                    The goal isn&apos;t to replace human creativity but to enhance it with data-driven insights. 
                    Think of Tweetalytics as having a social media expert review your content before you 
                    hit publish—except this expert never sleeps and has analyzed thousands of viral posts.
                  </p>
                </section>

                {/* Algorithm Section */}
                <section id="algorithm" className="mb-16">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    🎮 Gaming the Algorithm (Ethically)
                  </h2>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    The phrase &quot;gaming the algorithm&quot; often carries negative connotations, but our 
                    approach is fundamentally different. We&apos;re not trying to trick or manipulate 
                    platforms—we&apos;re aligning with what they already want: engaging, authentic content 
                    that creates meaningful interactions.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
                      <h3 className="font-semibold text-red-800 mb-3">❌ What We DON&apos;T Do</h3>
                      <ul className="text-red-700 text-sm space-y-2">
                        <li>• Fake engagement or bot networks</li>
                        <li>• Clickbait or misleading content</li>
                        <li>• Automated posting or spamming</li>
                        <li>• Manipulation tactics that harm users</li>
                      </ul>
                    </div>
                    <div className="bg-green-50 border border-green-200 p-6 rounded-xl">
                      <h3 className="font-semibold text-green-800 mb-3">✅ What We DO</h3>
                      <ul className="text-green-700 text-sm space-y-2">
                        <li>• Optimize for genuine engagement</li>
                        <li>• Enhance authentic storytelling</li>
                        <li>• Improve content clarity and value</li>
                        <li>• Align with platform best practices</li>
                      </ul>
                    </div>
                  </div>

                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    Social media algorithms are designed to surface content that keeps users engaged 
                    and coming back. By understanding what drives engagement—authentic voice, 
                    valuable insights, emotional connection—we can create content that both serves 
                    our audience and performs well algorithmically.
                  </p>

                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-8 rounded-2xl border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">The Scientific Method Applied to Social Media</h3>
                    <ol className="text-gray-700 space-y-3">
                      <li><strong>1. Hypothesis:</strong> Certain content patterns drive higher engagement</li>
                      <li><strong>2. Data Collection:</strong> Analyze thousands of high-performing posts</li>
                      <li><strong>3. Pattern Recognition:</strong> Identify common elements in viral content</li>
                      <li><strong>4. Model Creation:</strong> Build predictive scoring algorithms</li>
                      <li><strong>5. Testing:</strong> Validate predictions against real-world performance</li>
                      <li><strong>6. Iteration:</strong> Continuously refine based on new data</li>
                    </ol>
                  </div>
                </section>

                {/* Future Section */}
                <section id="future" className="mb-16">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    🔮 What&apos;s Next
                  </h2>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    Tweetalytics is just the beginning. As we continue to gather data and refine our 
                    algorithms, we&apos;re working on several exciting developments:
                  </p>

                  <div className="space-y-6 mb-8">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Database className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Advanced Analytics Dashboard</h3>
                        <p className="text-gray-600">Deep insights into your content performance, audience engagement patterns, and growth trajectory over time.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Brain className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Content Suggestions</h3>
                        <p className="text-gray-600">Not just scoring existing content, but generating optimized content ideas based on your niche and audience.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Multi-Platform Optimization</h3>
                        <p className="text-gray-600">Expanding beyond Twitter to include LinkedIn, Instagram, and other platforms with platform-specific scoring.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-8 rounded-2xl border border-yellow-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Join the Experiment</h3>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      Tweetalytics is more than a tool—it&apos;s an ongoing experiment in the science of 
                      social media growth. Every user who joins helps us refine our understanding 
                      of what makes content go viral.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      Whether you&apos;re a fellow founder looking to build your brand, a creator wanting 
                      to reach more people, or simply someone curious about the intersection of data 
                      science and social media, we invite you to be part of this journey.
                    </p>
                  </div>
                </section>

                {/* Call to Action */}
                <div className="text-center py-16 border-t border-gray-200">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Optimize Your Content?</h2>
                  <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    Join thousands of creators who are using data-driven insights to grow their social media presence authentically.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Link href="/dashboard" className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                      Try Tweetalytics
                    </Link>
                    <Link href="/" className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                      Learn More
                    </Link>
                  </div>
                </div>

              </article>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default DocsPage 