import React from 'react'
import { Target, Users, Star, TrendingUp, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScoreDisplayProps {
  viralScore: number
  authenticity: number
  engagement: number
  quality: number
  insights?: {
    strengths: string[]
    improvements: string[]
    reasoning: string
  }
  className?: string
  compact?: boolean
}

export const TweetScoreDisplay: React.FC<ScoreDisplayProps> = ({
  viralScore,
  authenticity,
  engagement,
  quality,
  insights,
  className = '',
  compact = false
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Moderate'
    if (score >= 50) return 'Below Average'
    return 'Low'
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium',
          getScoreColor(viralScore)
        )}>
          <TrendingUp className="h-3 w-3" />
          {viralScore}/100
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          A:{authenticity}
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          E:{engagement}
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          Q:{quality}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Viral Score */}
      <div className="text-center">
        <div className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold',
          getScoreColor(viralScore)
        )}>
          <TrendingUp className="h-5 w-5" />
          <span className="text-lg">{viralScore}/100</span>
          <span className="text-sm font-normal">Viral Score</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {getScoreLabel(viralScore)} viral potential
        </p>
      </div>

      {/* Individual Scores */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium text-gray-700">Authenticity</span>
          </div>
          <div className={cn(
            'text-lg font-semibold px-3 py-1 rounded border',
            getScoreColor(authenticity)
          )}>
            {authenticity}
          </div>
          <p className="text-xs text-gray-500 mt-1">40% weight</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="h-4 w-4 text-green-500" />
            <span className="text-xs font-medium text-gray-700">Engagement</span>
          </div>
          <div className={cn(
            'text-lg font-semibold px-3 py-1 rounded border',
            getScoreColor(engagement)
          )}>
            {engagement}
          </div>
          <p className="text-xs text-gray-500 mt-1">35% weight</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-medium text-gray-700">Quality</span>
          </div>
          <div className={cn(
            'text-lg font-semibold px-3 py-1 rounded border',
            getScoreColor(quality)
          )}>
            {quality}
          </div>
          <p className="text-xs text-gray-500 mt-1">25% weight</p>
        </div>
      </div>

      {/* Insights */}
      {insights && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Info className="h-4 w-4" />
            Analysis Insights
          </div>

          {/* Reasoning */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-700">{insights.reasoning}</p>
          </div>

          {/* Strengths */}
          {insights.strengths.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-green-700 mb-2">✓ Strengths</h4>
              <ul className="space-y-1">
                {insights.strengths.map((strength, index) => (
                  <li key={index} className="text-xs text-green-600 pl-2 border-l-2 border-green-200">
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {insights.improvements.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-orange-700 mb-2">⚠ Areas for Improvement</h4>
              <ul className="space-y-1">
                {insights.improvements.map((improvement, index) => (
                  <li key={index} className="text-xs text-orange-600 pl-2 border-l-2 border-orange-200">
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Score Badge Component for use in lists
export const ScoreBadge: React.FC<{ score: number; label?: string; className?: string }> = ({ 
  score, 
  label = 'Score',
  className = '' 
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium',
      getScoreColor(score),
      className
    )}>
      <span>{score}</span>
      <span className="text-xs opacity-75">/{label}</span>
    </div>
  )
} 