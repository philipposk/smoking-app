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

Create a `.env.local` file for local development:

```bash
# OpenAI API Key (required for AI recommendations)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Google Maps API Key (for map functionality)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Social Media API Keys (optional)
FACEBOOK_APP_ID=your_facebook_app_id
TWITTER_API_KEY=your_twitter_api_key
INSTAGRAM_CLIENT_ID=your_instagram_client_id

# Database (if using external service)
DATABASE_URL=your_database_url_here
```

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
- 🖼️ **Gallery** - Save and organize favorite spots
- 💬 **Community Forum** - Connect with others
- 🤖 **AI Recommendations** - Get personalized suggestions
- 🌓 **Dark/Light Theme** - Toggle between themes
- 👤 **User Profiles** - Manage your account and preferences

