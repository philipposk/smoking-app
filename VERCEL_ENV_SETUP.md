# 🔐 Vercel Environment Variables Setup

## 📋 How to Add API Keys to Vercel

### Step 1: Go to Your Project Settings
1. Visit: https://vercel.com/filippos-projects-06f05211/smoking-app/settings
2. Or: Dashboard → smoking-app → Settings → Environment Variables

### Step 2: Add Environment Variables

Click **"Add New"** and add these two variables:

#### Variable 1: OPENAI_API_KEY
- **Key**: `OPENAI_API_KEY`
- **Value**: *(Your OpenAI API key - check your .env.local file)*
- **Environment**: Select all (Production, Preview, Development)

#### Variable 2: GROQ_API_KEY
- **Key**: `GROQ_API_KEY`
- **Value**: *(Your Groq API key - check your .env.local file)*
- **Environment**: Select all (Production, Preview, Development)

### Where to Find Your Keys

Your API keys are stored locally in `.env.local`:
- OpenAI key starts with: `sk-proj-...`
- Groq key starts with: `gsk_...`

**Important**: Copy the exact values from your `.env.local` file.

### Step 3: Redeploy
After adding the variables:
1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Or: Push a new commit to trigger auto-deploy

---

## ✅ Verification

After deployment, test your API:
1. Visit your Vercel URL: `https://smoking-app-xxx.vercel.app`
2. Go to the home page
3. Click "Get AI Recommendations"
4. Should return 5 recommendations ✅

---

## 🔒 Security Note

- ✅ These keys are in `.env.local` (not committed to GitHub)
- ✅ Add them to Vercel for production
- ✅ Never commit API keys to GitHub
- ✅ Vercel encrypts environment variables

---

## 🚀 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Project Settings**: https://vercel.com/filippos-projects-06f05211/smoking-app/settings
- **Environment Variables**: https://vercel.com/filippos-projects-06f05211/smoking-app/settings/environment-variables

