# 🐦 Twitter Integration Guide

## Overview

The Twitter Integration feature allows you to automatically import your top-performing tweets to train the AI on your writing style. This helps the AI generate content that matches your voice and tone more accurately.

## Setup

### 1. Environment Variables

Add your Twitter Bearer Token to your `.env.local` file:

```bash
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
```

### 2. Getting Twitter API Access

1. Visit [developer.twitter.com](https://developer.twitter.com)
2. Apply for a developer account
3. Create a new app in the developer portal
4. Generate a Bearer Token
5. Copy the Bearer Token to your environment file

## How It Works

### 1. Tweet Selection Algorithm

The system automatically selects your best tweets using an engagement scoring system:

- **Likes**: 1 point each
- **Retweets**: 3 points each (highest weight)
- **Replies**: 2 points each
- **Quote Tweets**: 2 points each

### 2. Filtering Rules

- Only original tweets (no retweets or replies)
- Maximum 100 recent tweets analyzed
- Top 10 by engagement score selected
- Automatic deduplication if already imported

### 3. Training Integration

Imported tweets are added to your training examples and immediately available for AI training. The AI uses these examples to:

- Learn your writing style and tone
- Understand your typical content themes
- Match your communication patterns
- Improve content generation accuracy

## Using the Feature

### From the Training Page

1. Navigate to `/dashboard/training`
2. Click the "Link Twitter" button
3. Enter your Twitter username (without @)
4. Click "Import Tweets"

### What Happens

1. System fetches your recent tweets
2. Calculates engagement scores
3. Selects top 10 performers
4. Adds them to your training data
5. Updates your AI training instantly

## API Endpoint

### POST `/api/import-twitter-tweets`

**Request Body:**
```json
{
  "userId": "user_uuid",
  "twitterUsername": "username"
}
```

**Success Response:**
```json
{
  "success": true,
  "imported": 5,
  "availableSlots": 5,
  "examples": [...],
  "topTweets": [
    {
      "text": "Tweet content...",
      "engagement": 125,
      "metrics": {
        "like_count": 45,
        "retweet_count": 20,
        "reply_count": 8,
        "quote_count": 2
      }
    }
  ]
}
```

**Error Responses:**
- `400`: Missing username or user ID
- `404`: Twitter user not found or no tweets
- `500`: API not configured or server error

## Limitations

- Maximum 10 training examples total
- Only analyzes last 100 tweets
- Requires Twitter Developer account
- Rate limited by Twitter API

## Privacy & Security

- Only public tweet data is accessed
- No posting or writing permissions required
- Bearer Token only needs read access
- Data stored securely in your database
- You control which tweets to keep or remove

## Troubleshooting

### "Twitter API not configured"
- Ensure `TWITTER_BEARER_TOKEN` is set in `.env.local`
- Restart your development server after adding the token

### "Twitter user not found"
- Check username spelling (don't include @)
- Ensure the account is public
- Make sure the account has tweets

### "No available slots"
- You already have 10 training examples
- Delete some existing examples to make room

### "Failed to fetch tweets"
- Check Twitter API rate limits
- Verify your Bearer Token is valid
- Ensure your developer account is active

## Best Practices

1. **Use your main account**: Import from your primary Twitter account for best results
2. **Regular updates**: Re-import periodically as your style evolves
3. **Quality over quantity**: The system automatically selects your best content
4. **Review imports**: Check imported tweets and remove any that don't represent your style
5. **Combine with manual training**: Use both imported tweets and manual examples for best results

---

*This feature dramatically improves AI training by using your proven high-performing content as examples.* 