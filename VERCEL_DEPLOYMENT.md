# Deploy January Push to Vercel with Your Own Supabase

Complete guide to deploying your own instance separate from the Lovable version.

## Prerequisites

- GitHub account
- Vercel account (free tier is fine)
- Supabase account (free tier is fine)

## Step 1: Create Your Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name:** `january-push-forum` (or your choice)
   - **Database Password:** Choose a strong password (save it!)
   - **Region:** Select closest to your users
4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

## Step 2: Set Up Database

1. In your new Supabase project, click **"SQL Editor"** in left sidebar
2. Click **"New query"**
3. Open the file `SETUP_NEW_SUPABASE.sql` from this repo
4. Copy ALL the SQL and paste into the editor
5. Click **"Run"** or press `Cmd/Ctrl + Enter`
6. You should see "Success. No rows returned"

## Step 3: Get Your Credentials

1. In Supabase, go to **Settings → API** (gear icon in sidebar)
2. Copy these values:
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   Project API key (anon, public): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Keep these handy - you'll need them in Step 5

## Step 4: Fork/Clone the Repository

**Option A: If you have your own GitHub repo already**
- Skip to Step 5

**Option B: Create a new repo from this code**
1. Go to your GitHub
2. Click "New repository"
3. Name it `january-push`
4. Push your local code:
   ```bash
   cd ~/Desktop/january-push
   git remote set-url origin https://github.com/YOUR_USERNAME/january-push.git
   git push -u origin main
   ```

## Step 5: Deploy to Vercel

1. Go to https://vercel.com
2. Click **"Add New Project"**
3. Import your GitHub repository:
   - Click **"Import Git Repository"**
   - Select `january-push`
4. Configure the project:
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)

5. **Add Environment Variables** (CRITICAL):
   Click **"Environment Variables"** and add:

   ```
   VITE_SUPABASE_URL = https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_SUPABASE_PROJECT_ID = xxxxxxxxxxxxx
   ```

   Use the values from Step 3!

6. Click **"Deploy"**
7. Wait 2-3 minutes for deployment

## Step 6: Test Your Deployment

1. Vercel will give you a URL like: `https://january-push-xxxxx.vercel.app`
2. Open it in your browser
3. Click "Sign Up"
4. Create a test account
5. Set a nickname
6. Create a group
7. Log some activity

## Step 7: Custom Domain (Optional)

1. In Vercel, go to **Settings → Domains**
2. Add your custom domain
3. Follow DNS instructions

## Troubleshooting

### Blank Page or "Missing Supabase URL" Error

**Problem:** Environment variables not set correctly

**Fix:**
1. Go to Vercel project → Settings → Environment Variables
2. Verify all three variables are set
3. Click "Redeploy" to rebuild with correct variables

### "Failed to create account" Error

**Problem:** Database migrations didn't run

**Fix:**
1. Go to Supabase SQL Editor
2. Re-run the `SETUP_NEW_SUPABASE.sql` script
3. Check for any error messages in the SQL output

### Rate Limit Errors

**Problem:** Hit Supabase free tier limits

**Fix:**
- Free tier allows 50,000 monthly active users
- Monitor usage in Supabase Dashboard
- Upgrade to Pro ($25/mo) if needed

## Monitoring

### Supabase Dashboard
- **Database → Table Editor:** See user data
- **Authentication → Users:** See signup activity
- **Logs → Postgres:** See database queries

### Vercel Dashboard
- **Analytics:** Page views, visitors
- **Logs:** Application errors
- **Deployments:** Redeploy history

## Updating Your Deployment

When you make code changes:

1. Push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

2. Vercel auto-deploys on every push!

## Separate Instances

You now have:
- **Lovable instance:** For your mates (original)
- **Vercel instance:** For the forum (new deployment)

They are completely isolated - no shared data!

## Cost Breakdown

**Free Tier (Good for 100-1000 users):**
- Vercel: Free
- Supabase: Free (500MB database, 2GB bandwidth)

**If You Get Popular:**
- Vercel: $20/month (Pro)
- Supabase: $25/month (Pro)

**Total:** ~$45/month at scale

---

**Questions?** The app is ready to deploy! Follow these steps and you'll have your own instance in ~15 minutes.
