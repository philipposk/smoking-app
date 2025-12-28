# 🗺️ Google Maps API Key Setup Guide

## Step-by-Step Instructions

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/apis/credentials?project=smoking-482610
2. Sign in with your Google account

### Step 2: Enable Required APIs
1. Go to **APIs & Services** → **Library**
2. Search and enable these APIs:
   - ✅ **Maps JavaScript API** (for displaying maps)
   - ✅ **Places API** (for searching places, shops, etc.)
   - ✅ **Geocoding API** (for converting addresses to coordinates)
   - ✅ **Maps Embed API** (optional, for embedded maps)

### Step 3: Create API Key
1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"API key"**
4. Copy the generated API key (starts with `AIza...`)

### Step 4: Restrict API Key (Important for Security)
1. Click on your newly created API key to edit it
2. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Check only:
     - ✅ Maps JavaScript API
     - ✅ Places API
     - ✅ Geocoding API
3. Under **"Application restrictions"**:
   - Select **"HTTP referrers (web sites)"**
   - Add these referrers:
     - `http://localhost:3000/*` (for local development)
     - `https://smoking.6x7.gr/*` (your custom domain)
     - `https://*.vercel.app/*` (Vercel deployments)
4. Click **"SAVE"**

### Step 5: Add to Vercel
1. Go to: https://vercel.com/filippos-projects-06f05211/smoking-app/settings/environment-variables
2. Click **"Add New"**
3. Add:
   - **Key**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - **Value**: `AIza...` (your API key)
   - **Environments**: Select all (Production, Preview, Development)
4. Click **"Save"**

### Step 6: Redeploy
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**

## ✅ Verification

After redeploying, visit your app and go to `/map`:
- If the key is configured correctly, you'll see: "✅ Google Maps API key configured"
- The map should load automatically

## 💰 Pricing

Google Maps has a **free tier**:
- **$200 free credit per month**
- Maps JavaScript API: Free for first 28,000 loads/month
- Places API: Free for first 17,000 requests/month
- Geocoding API: Free for first 40,000 requests/month

For a community app, this should be plenty!

## 🔒 Security Notes

- ✅ Always restrict your API key to specific APIs
- ✅ Add HTTP referrer restrictions
- ✅ Monitor usage in Google Cloud Console
- ✅ Set up billing alerts (free tier should cover most usage)

## 📝 Quick Links

- **Credentials Page**: https://console.cloud.google.com/apis/credentials?project=smoking-482610
- **API Library**: https://console.cloud.google.com/apis/library?project=smoking-482610
- **Billing**: https://console.cloud.google.com/billing?project=smoking-482610

---

**Once you have the key, add it to Vercel and redeploy!**

