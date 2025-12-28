# 🚀 Deployment Guide

## ✅ Your App is on GitHub
**Repository**: https://github.com/philipposk/smoking-app

## ❌ GitHub Pages Won't Work
GitHub Pages only hosts **static sites**. Your app needs:
- ✅ Server-side rendering (Next.js)
- ✅ API routes (`/api/recommendations`)
- ✅ Backend for AI API calls

## 🎯 Best Deployment Options

### 1. **Vercel** (⭐ RECOMMENDED - Best for Next.js)
**Why**: Made by Next.js creators, zero-config deployment

**Pros:**
- ✅ Free tier (generous)
- ✅ Automatic deployments from GitHub
- ✅ Built-in SSL
- ✅ Custom domains (smoking.6x7.gr)
- ✅ Environment variables management
- ✅ Perfect Next.js support

**Deploy Steps:**
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New Project"
4. Import `philipposk/smoking-app`
5. Add environment variables:
   - `OPENAI_API_KEY`
   - `GROQ_API_KEY`
6. Click "Deploy"
7. Add custom domain: `smoking.6x7.gr`

**Cost**: FREE (hobby plan)

---

### 2. **Fly.io** (Good Alternative)
**Why**: Full control, Docker-based

**Pros:**
- ✅ Free tier available
- ✅ Global edge network
- ✅ Good for API-heavy apps
- ✅ Custom domains

**Deploy Steps:**
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch: `fly launch`
4. Set secrets: `fly secrets set OPENAI_API_KEY=... GROQ_API_KEY=...`
5. Deploy: `fly deploy`

**Cost**: FREE tier (3 shared VMs)

---

### 3. **Cloudflare Pages** (Fast & Free)
**Why**: Excellent performance, free tier

**Pros:**
- ✅ Free tier
- ✅ Global CDN
- ✅ Fast deployments
- ✅ Custom domains

**Note**: May need Cloudflare Workers for API routes

**Deploy Steps:**
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Pages → Create a project
3. Connect GitHub repo
4. Build settings: `npm run build`
5. Add environment variables
6. Deploy

**Cost**: FREE

---

### 4. **Firebase Hosting** (Google)
**Why**: Google infrastructure

**Pros:**
- ✅ Free tier
- ✅ Fast CDN
- ✅ Easy setup
- ✅ Custom domains

**Note**: Need Firebase Functions for API routes

**Deploy Steps:**
1. Install: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Init: `firebase init`
4. Deploy: `firebase deploy`

**Cost**: FREE (Spark plan)

---

## 🏆 RECOMMENDATION: Vercel

**Why Vercel is best for your app:**
1. ✅ Zero configuration needed
2. ✅ Automatic deployments from GitHub
3. ✅ Perfect Next.js support (made by Next.js team)
4. ✅ Free tier is very generous
5. ✅ Easy environment variable management
6. ✅ Custom domain support (smoking.6x7.gr)
7. ✅ Built-in analytics

## 📋 Quick Deploy to Vercel

### Via Dashboard (Easiest):
1. Visit: https://vercel.com/new
2. Import: `philipposk/smoking-app`
3. Add Environment Variables:
   ```
   OPENAI_API_KEY=sk-proj-...
   GROQ_API_KEY=gsk_...
   ```
4. Click "Deploy"
5. Done! Your app will be live in ~2 minutes

### Via CLI:
```bash
npm i -g vercel
vercel login
cd "/Users/phktistakis/Devoloper Projects/Smoking"
vercel
# Follow prompts, add env vars when asked
vercel --prod  # For production
```

## 🌐 Custom Domain Setup (smoking.6x7.gr)

After deploying to Vercel:
1. Go to Project Settings → Domains
2. Add: `smoking.6x7.gr`
3. Vercel will show DNS instructions
4. Add CNAME record in your DNS:
   - Name: `smoking`
   - Value: `cname.vercel-dns.com`
5. Wait for DNS propagation (~5-30 min)

## 🔐 Environment Variables to Add

When deploying, add these:
- `OPENAI_API_KEY` - Your OpenAI key
- `GROQ_API_KEY` - Your Groq key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - (Optional, for maps)

## 💰 Cost Comparison

| Platform | Free Tier | Best For |
|----------|-----------|----------|
| **Vercel** | ✅ Yes | Next.js apps |
| **Fly.io** | ✅ Yes | Full control |
| **Cloudflare** | ✅ Yes | Static + Edge |
| **Firebase** | ✅ Yes | Google ecosystem |

**All have free tiers that should work for your app!**

---

## 🚀 Ready to Deploy?

**Recommended**: Start with **Vercel** - it's the easiest and best for Next.js!

Visit: https://vercel.com/new

