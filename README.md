# Tweetalytics - AI-Powered Tweet Optimization

Transform your ideas into viral tweets with AI scoring and optimization. No guesswork, no stress, just data-driven content creation.

## Features

- **Voice to Tweet**: Record your thoughts and transform them into optimized tweets
- **Viral Scoring**: AI-powered analysis to predict viral potential
- **Multi-Modal Content**: Different optimization strategies for different content types
- **Performance Tracking**: Monitor and improve your content performance
- **Smart Publishing**: Schedule and automate your social media presence

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/your-username/tweetalytics.git
cd tweetalytics
```

## 🎯 Current Status

✅ **Production Ready** - The application is fully functional with real AI integration and smart fallback system.

**Key Features Working:**
- ✅ Complete authentication system with Supabase
- ✅ Real-time kanban tweet management with database persistence
- ✅ Voice recording and OpenAI Whisper transcription
- ✅ AI tweet generation with Anthropic Claude API
- ✅ Training system for personalized AI responses
- ✅ Analytics dashboard with performance tracking
- ✅ Responsive design with modern UI/UX
- ✅ Smart API status monitoring with fallbacks
- ✅ Comprehensive setup guide at `/setup`

**Smart Demo Mode**: The app automatically detects missing API keys and gracefully falls back to demo functionality while clearly indicating status to users. Perfect for development and testing!

## 🚀 Features

### Core Functionality
- **Voice to Tweet**: Record voice memos that automatically become engaging tweets
- **AI Tweet Generation**: Claude AI learns your writing style and creates personalized content
- **Kanban-Style Management**: Organize tweets through Generated → In Review → Approved → Published workflow
- **Training System**: Add example tweets to train the AI on your unique voice and style
- **Analytics Dashboard**: Track performance metrics and engagement insights
- **Auto Scheduling**: Automatic posting and performance tracking

### Technical Features
- **Next.js 14** with App Router
- **Supabase** for authentication and database
- **Anthropic Claude API** for AI tweet generation
- **OpenAI Whisper** for voice transcription
- **TailwindCSS** for modern UI design
- **TypeScript** for type safety
- **Real-time updates** with Supabase subscriptions

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Anthropic API key
- OpenAI API key

### 1. Clone and Install
```bash
git clone <repository-url>
cd tweetalytics
npm install
```

### 2. Environment Variables
Copy `env.example` to `.env.local` and fill in your credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key

# App Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. Database Setup
The following Supabase tables are required:

#### Users Table
```sql
create table users (
  id uuid references auth.users on delete cascade primary key,
  username text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### Ideas Table
```sql
create table ideas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  content text,
  type text check (type in ('text', 'voice')),
  audio_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### Tweets Table
```sql
create table tweets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  idea_id uuid references ideas(id) on delete cascade,
  content text,
  status text check (status in ('generated', 'in_review', 'approved', 'published')) default 'generated',
  scheduled_time timestamp with time zone,
  performance jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### Training Examples Table
```sql
create table training_examples (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  tweet_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### Tweet Feedback Table
```sql
create table tweet_feedback (
  id uuid default gen_random_uuid() primary key,
  tweet_id uuid references tweets(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📱 Usage Guide

### Getting Started
1. **Sign Up**: Create an account using Google or GitHub OAuth
2. **Add Training Examples**: Go to Training page and add 5-10 examples of your best tweets
3. **Create Content**: Use voice recording or text input to generate tweet ideas
4. **Manage Tweets**: Use the kanban board to review, edit, and approve generated tweets
5. **Track Performance**: Monitor analytics and engagement metrics

### Voice to Tweet Workflow
1. Click "Start Recording" on the dashboard
2. Speak your idea naturally (30 seconds recommended)
3. AI transcribes and generates 3 tweet variations
4. Review and edit in the kanban board
5. Approve and schedule for posting

### Training the AI
- Add examples of your best-performing tweets
- Include different topics and styles you write about
- The AI learns your tone, structure, and voice
- More examples = better personalized content

## 🏗️ Architecture

### Frontend
- **Next.js 14** with App Router for modern React development
- **TailwindCSS** for responsive, utility-first styling
- **Lucide React** for consistent iconography
- **React Hot Toast** for user notifications
- **Recharts** for analytics visualizations

### Backend
- **Supabase** for authentication, database, and real-time features
- **Anthropic Claude** for intelligent tweet generation
- **OpenAI Whisper** for accurate voice transcription
- **Row Level Security** for data protection

### Key Components
- `AuthProvider`: Manages user authentication state
- `DashboardLayout`: Consistent navigation and layout
- `IdeaCapture`: Voice recording and text input interface
- `TweetBoard`: Kanban-style tweet management
- `TweetCard`: Individual tweet editing and actions

## 🔒 Security Features

- **Row Level Security**: Database queries automatically filtered by user
- **Authentication Required**: All routes protected except landing page
- **API Key Protection**: Server-side API calls only
- **Input Validation**: Client and server-side validation
- **HTTPS Only**: Secure data transmission

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Works with Next.js static export
- **Railway**: Full-stack deployment with database
- **DigitalOcean**: App Platform deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Open a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas

## 🔮 Roadmap

- [ ] Twitter API integration for actual posting
- [ ] Multi-platform support (LinkedIn, Facebook)
- [ ] Advanced scheduling with optimal timing
- [ ] Team collaboration features
- [ ] A/B testing for tweet variations
- [ ] Advanced analytics and insights
- [ ] Mobile app development
- [ ] Integration with social media management tools

---

Built with ❤️ to democratize social media management and remove the need for expensive agencies. 