# Database Setup

This folder contains all database-related files for the Tweetalytics application.

## 📁 Structure

```
database/
├── migrations/           # Database schema and data migrations
│   ├── viral-scoring-migration.sql    # Main schema setup
│   ├── transcript-features-migration.sql  # Transcript and insights features
│   └── supabase-settings-update.sql   # Settings configuration
├── triggers/            # Database triggers and functions
│   └── supabase-user-trigger.sql      # User creation triggers
└── README.md           # This file
```

## 🚀 Setup Instructions

### 1. Supabase Project Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Note your project URL and anon key from Settings → API

### 2. Run Migrations
Execute these SQL files in order in your Supabase SQL editor:

```sql
-- 1. Main schema setup
-- Run: migrations/viral-scoring-migration.sql

-- 2. User triggers
-- Run: triggers/supabase-user-trigger.sql

-- 3. Transcript features
-- Run: migrations/transcript-features-migration.sql

-- 4. Settings configuration
-- Run: migrations/supabase-settings-update.sql
```

### 3. Environment Configuration
Add your Supabase credentials to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🗄️ Database Schema

### Core Tables
- **users** - User profiles and preferences
- **ideas** - Raw user input (text/voice recordings)  
- **tweets** - Generated tweets with scores and statuses
- **tweet_feedback** - User feedback on generated content
- **training_examples** - User's writing samples for AI training

### Long-Form Content Features
- **transcripts** - Stored transcripts with metadata and processing status
- **insights** - Extracted insights from transcripts with speaker attribution
- **tweets.transcript_id** - Links tweets back to their source transcript
- **tweets.insight_id** - Links tweets back to their source insight

### Row Level Security (RLS)
All tables have RLS enabled to ensure users can only access their own data.

## 🔧 Development

### Adding New Migrations
1. Create new `.sql` file in `migrations/` folder
2. Use descriptive naming: `YYYY-MM-DD-feature-name.sql`
3. Include both `up` and `down` migration code
4. Test in development before deploying

### Adding New Triggers
1. Create new `.sql` file in `triggers/` folder
2. Include function definition and trigger creation
3. Add documentation comments explaining purpose 