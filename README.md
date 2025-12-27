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

```
# Add your API keys here
```

