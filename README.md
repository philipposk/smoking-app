# Smoking App

A modern web application built with Next.js, TypeScript, and React.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

This project is configured for deployment on Vercel (supports API routes for AI integrations).

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import the repository: `philipposk/smoking-app`
4. Vercel will auto-detect Next.js settings
5. Click "Deploy"
6. After deployment, go to Project Settings → Domains
7. Add your custom domain: `smoking.6x7.gr`
8. Follow DNS configuration instructions (add CNAME record)

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. For production deployment:
```bash
vercel --prod
```

5. Add custom domain in Vercel dashboard: Project Settings → Domains → Add `smoking.6x7.gr`

### DNS Configuration

For `smoking.6x7.gr` domain:
- Add a CNAME record pointing to: `cname.vercel-dns.com`
- Or use A record if Vercel provides an IP (check Vercel dashboard)

## Environment Variables

### Where to Add Your OpenAI API Key

1. **Create `.env.local` file** in the project root (already created for you)
2. **Get your OpenAI API key:**
   - Go to https://platform.openai.com/api-keys
   - Sign in or create an account
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)
3. **Add it to `.env.local`:**
   ```bash
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
4. **Restart your dev server** after adding the key

### All Environment Variables

The `.env.local` file is already created in your project. Just replace the placeholder values:

```bash
# OpenAI API Key (required for AI recommendations)
# Get your key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-api-key-here

# Google Maps API Key (for map functionality)
# Get your key from: https://console.cloud.google.com/apis/credentials
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Social Media API Keys (optional)
FACEBOOK_APP_ID=your_facebook_app_id
TWITTER_API_KEY=your_twitter_api_key
INSTAGRAM_CLIENT_ID=your_instagram_client_id

# Database (if using external service)
DATABASE_URL=your_database_url_here
```

**Important:** The `.env.local` file is already in `.gitignore`, so your keys won't be committed to GitHub.

## AI Integration

This app uses **direct OpenAI API integration** for AI-powered recommendations. This approach is:
- ✅ **Simpler** - Direct API calls, no additional framework needed
- ✅ **More flexible** - Full control over prompts and responses
- ✅ **Better for recommendations** - Optimized for structured data output
- ✅ **Cost-effective** - Pay only for what you use

### Why not ChatKit?

[OpenAI ChatKit](https://github.com/openai/openai-chatkit-starter-app) is great for **conversational chat interfaces**, but for this app:
- We need structured recommendations, not chat
- Direct API gives more control over the recommendation logic
- Simpler integration with existing Next.js structure

If you want to add a conversational AI assistant later, ChatKit could be added as an additional feature.

## Features

- 🗺️ **Map View** - Find smoking places with Google Maps
- 🌍 **3D World View** - Interactive globe to explore places by country/city/district
- 📋 **List View** - Browse places in a list format
- 🖼️ **Gallery** - Save and organize favorite spots
- 💬 **Community Forum** - Connect with others
- 🤖 **AI Recommendations** - Get personalized suggestions
- 🌓 **Dark/Light Theme** - Toggle between themes
- 👤 **User Profiles** - Manage your account and preferences
- 🧩 **Widgets** - Quick search, filters, trending places, and quick actions

### View Modes (Like Airbnb)

The app supports three view modes that you can toggle:
- **List View** - Browse places in a list
- **Map View** - See places on a map
- **3D World View** - Interactive globe to explore by location (country → city → district → place)

### Widgets

The app includes several useful widgets:
- **Quick Search** - Fast search across places
- **Filters** - Filter by type, rating, etc.
- **Trending Places** - See what's popular
- **Quick Actions** - Fast access to common actions

