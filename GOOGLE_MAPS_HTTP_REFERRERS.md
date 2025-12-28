# 🔒 How to Add HTTP Referrers to Google Maps API Key

## Step-by-Step

### 1. Go to Your API Key
1. Visit: https://console.cloud.google.com/apis/credentials?project=smoking-482610
2. Click on your API key (the one you just created)

### 2. Add HTTP Referrers
1. Scroll down to **"Application restrictions"** section
2. Select **"HTTP referrers (web sites)"**
3. Click **"+ ADD AN ITEM"** and add these one by one:

   **For Local Development:**
   ```
   http://localhost:3000/*
   ```

   **For Your Custom Domain:**
   ```
   https://smoking.6x7.gr/*
   ```

   **For Vercel Deployments:**
   ```
   https://*.vercel.app/*
   ```

   **For Preview Deployments (optional):**
   ```
   https://smoking-app-*.vercel.app/*
   ```

### 3. Save
- Click **"SAVE"** at the bottom
- Wait a few minutes for changes to propagate

### 4. Test
- Visit your deployed app
- Go to `/map` page
- The map should load if the key is configured correctly

## ✅ What You Should See

After adding referrers, your API key settings should show:
- **Application restrictions**: HTTP referrers (web sites)
- **Website restrictions**: 
  - `http://localhost:3000/*`
  - `https://smoking.6x7.gr/*`
  - `https://*.vercel.app/*`

## 🔍 Verify It's Working

1. Check Vercel environment variable is set: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
2. Visit your app: `https://smoking.6x7.gr/map`
3. Open browser console (F12)
4. If working: Map loads ✅
5. If not: Check console for errors (usually "RefererNotAllowedMapError")

---

**Note**: Changes to API key restrictions can take 5-10 minutes to propagate.

