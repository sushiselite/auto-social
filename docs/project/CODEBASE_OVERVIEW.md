# Tweetalytics - Codebase Overview

## 🎯 Project Overview
**Tweetalytics** is an AI-powered social media optimization platform that transforms ideas into viral-ready tweets. It uses voice-to-text transcription, AI content generation, and a sophisticated viral scoring system to help users create engaging social media content.

## 🛠️ Technology Stack

### Core Framework
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **TailwindCSS** for styling
- **Vercel** for deployment

### Backend & Database
- **Supabase** for authentication, database, and real-time features
- **PostgreSQL** database (via Supabase)

### AI Services
- **Anthropic Claude** for tweet generation and optimization
- **OpenAI Whisper** for voice-to-text transcription

### Key Libraries
- `@dnd-kit` - Drag and drop for Kanban board
- `react-dropzone` - File upload handling
- `react-hot-toast` - Toast notifications
- `recharts` - Analytics charts
- `lucide-react` - Icons
- `date-fns` - Date formatting

## 📁 Project Structure

```
auto-social/
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing page
│   ├── globals.css                # Global styles
│   ├── api/                       # API routes
│   │   ├── generate-tweets/       # Tweet generation endpoint
│   │   └── transcribe-audio/      # Audio transcription endpoint
│   ├── dashboard/                 # Main application
│   │   ├── page.tsx              # Dashboard home
│   │   ├── analytics/            # Analytics page
│   │   ├── create/               # Tweet creation flow
│   │   ├── tweets/               # Kanban board
│   │   ├── settings/             # User settings
│   │   └── training/             # AI training examples
│   ├── docs/                     # Documentation pages
│   └── setup/                    # Setup guide page
├── components/                    # React components
│   ├── ui/                       # Base UI components
│   ├── layout/                   # Layout components
│   ├── dashboard/                # Dashboard-specific components
│   └── providers/                # Context providers
├── lib/                          # Utility libraries
│   ├── ai-client.ts             # AI service integration
│   ├── viral-scoring.ts         # Viral potential scoring algorithm
│   ├── supabase.ts              # Database client & types
│   ├── ai-fallback.ts           # Demo mode fallbacks
│   └── utils.ts                 # General utilities
└── SQL files                     # Database setup scripts
```

## 🗄️ Database Schema

### Core Tables
- **users** - User profiles and preferences
- **ideas** - Raw user input (text/voice recordings)
- **tweets** - Generated tweets with scores and statuses
- **tweet_feedback** - User feedback on generated content
- **training_examples** - User's writing samples for AI training

### Tweet Workflow States
```
generated → in_review → approved → published
```

## 🧠 Core Features & Components

### 1. Voice-to-Tweet Pipeline
**Location**: `components/dashboard/IdeaCapture.tsx`
- Records voice using Web Audio API
- Transcribes via OpenAI Whisper API (`/api/transcribe-audio`)
- Generates tweets via Anthropic Claude (`/api/generate-tweets`)
- Smart fallback to demo mode if APIs unavailable

### 2. AI Tweet Generation
**Location**: `lib/ai-client.ts`
- **Input**: User idea (text/voice), training examples, tone preferences
- **Processing**: Anthropic Claude with custom prompts
- **Output**: Multiple tweet variations with viral scores
- **Fallback**: Demo content when APIs unavailable

### 3. Viral Scoring Algorithm
**Location**: `lib/viral-scoring.ts`
- **Authenticity Score** (40% weight) - Human-like writing, natural flow
- **Engagement Prediction** (35% weight) - Reply potential, shareability  
- **Quality Signals** (25% weight) - Readability, clarity, value
- **Content Modes**: Thought leadership, community engagement, personal brand, value-first

### 4. Kanban Tweet Management
**Location**: `components/dashboard/TweetBoard.tsx`
- Drag-and-drop interface using `@dnd-kit`
- Real-time updates via Supabase subscriptions
- Status management: generated → in_review → approved → published
- Performance tracking and analytics

### 5. Authentication & User Management
**Location**: `components/providers/AuthProvider.tsx`
- Supabase Auth with email/social login
- User preferences and settings storage
- Session management across app

## 🔧 Key Configuration Files

### Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Services
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Optional: Twitter Integration
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_TOKEN_SECRET=
TWITTER_BEARER_TOKEN=
```

### Database Setup
Run these SQL files in Supabase:
- `viral-scoring-migration.sql` - Main schema
- `supabase-user-trigger.sql` - User creation triggers
- `supabase-settings-update.sql` - Settings management

## 🎨 UI/UX Patterns

### Design System
- **TailwindCSS** with custom utility classes
- **Card-based layouts** with hover effects
- **Consistent color scheme**: Indigo primary, semantic colors for status
- **Responsive design** with mobile-first approach

### Common UI Components
- `components/ui/LoadingSpinner.tsx` - Loading states
- `components/ui/Button.tsx` - Styled buttons
- `components/layout/DashboardLayout.tsx` - Page wrapper
- Toast notifications via `react-hot-toast`

## 🚀 Development Workflow

### Running Locally
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### API Integration Patterns
- **Smart Fallbacks**: All AI features gracefully degrade to demo mode
- **Error Handling**: Comprehensive try-catch with user-friendly messages
- **Real-time Updates**: Supabase subscriptions for live data
- **Optimistic Updates**: UI updates before API confirmation

## 🔍 Key Code Patterns

### 1. AI Service Integration
```typescript
// Pattern for AI calls with fallbacks
try {
  const response = await fetch('/api/generate-tweets', { /* options */ })
  if (!response.ok) throw new Error()
  return await response.json()
} catch (error) {
  return generateDemoTweets(options) // Fallback
}
```

### 2. Database Operations
```typescript
// Supabase query pattern
const { data, error } = await supabase
  .from('tweets')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
```

### 3. Real-time Subscriptions
```typescript
// Real-time updates pattern
useEffect(() => {
  const subscription = supabase
    .channel('tweets')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tweets' }, 
        payload => { /* handle update */ })
    .subscribe()
  
  return () => subscription.unsubscribe()
}, [])
```

## 🧪 Demo Mode Features
When API keys are missing, the app provides:
- **Demo tweet generation** with realistic content
- **Mock viral scores** based on content analysis
- **Simulated transcription** for voice features
- **Clear status indicators** showing demo vs. live mode

## 📊 Analytics & Performance
- **Tweet performance tracking** in dashboard
- **Viral score analytics** with charts (Recharts)
- **User engagement metrics** stored in database
- **Real-time statistics** updated via Supabase

## 🔐 Security Considerations
- **Environment variables** for sensitive keys
- **Row Level Security** (RLS) enabled in Supabase
- **User data isolation** via user_id filtering
- **API rate limiting** handled by external services

## 🚦 Common Development Tasks

### Adding New Features
1. Create API route in `app/api/` if needed
2. Add database tables/columns in Supabase
3. Update TypeScript types in `lib/supabase.ts`
4. Build UI components in `components/`
5. Add to appropriate dashboard page

### Debugging Tips
- Check browser console for API errors
- Verify environment variables are set
- Use `ApiStatus` component to check service availability
- Monitor Supabase logs for database issues
- Check Network tab for failed requests

This documentation provides the foundation for understanding and extending the Tweetalytics codebase. The modular architecture and comprehensive fallback systems make it easy to add new features while maintaining reliability. 