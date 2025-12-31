# Vercel Deployment Guide

## Quick Start

This guide will help you deploy the Analytics Challenge application to Vercel with proper environment variable configuration.

## Prerequisites

- ✅ Vercel account ([Sign up here](https://vercel.com/signup))
- ✅ Git repository (GitHub, GitLab, or Bitbucket)
- ✅ Supabase project with database schema and seed data
- ✅ Node.js 20+ installed locally (for testing)

## Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure your code is committed and pushed to your Git repository:

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click **"Add New Project"**
3. Select your Git provider (GitHub/GitLab/Bitbucket)
4. Import the `analytics-challenge` repository
5. Vercel will automatically detect the Next.js framework

### 3. Configure Environment Variables

**CRITICAL**: You must configure these environment variables before deployment.

#### Required Environment Variables

| Variable Name | Example Value | Where to Find |
|---------------|---------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase Project Settings → API → anon public |

#### How to Add Environment Variables in Vercel

**Option A: During Initial Deployment**
1. In the import screen, expand **"Environment Variables"**
2. Add each variable:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: Your Supabase URL
   - Select all environments: Production, Preview, Development
3. Repeat for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**

**Option B: After Deployment**
1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter variable name and value
5. Select environments: ✅ Production, ✅ Preview, ✅ Development
6. Click **Save**
7. **Important**: Redeploy your application for changes to take effect
   - Go to **Deployments** tab
   - Click the three dots (•••) on the latest deployment
   - Select **Redeploy**

### 4. Deploy

Click the **Deploy** button. Vercel will:
- Install dependencies (`npm install`)
- Build your Next.js application (`npm run build`)
- Deploy to production

The build process takes approximately 2-3 minutes.

### 5. Verify Deployment

Once deployed, you'll receive a production URL (e.g., `https://analytics-challenge.vercel.app`).

**Test the following:**
1. ✅ Visit the production URL
2. ✅ Navigate to `/auth/login`
3. ✅ Login with test users:
   - User A: `usera@test.com` / `TestUser123!`
   - User B: `userb@test.com` / `TestUser123!`
4. ✅ Check dashboard loads correctly
5. ✅ Verify charts and analytics display data
6. ✅ Test post creation and engagement features

## Continuous Deployment

Vercel automatically deploys when you push to your repository:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main
```

- **Main branch** → Production deployment
- **Other branches** → Preview deployments

## Troubleshooting

### Build Fails

**Check build logs:**
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the failed deployment
3. Review the build logs for errors

**Common issues:**
- Missing dependencies → Check `package.json`
- TypeScript errors → Run `npm run build` locally first
- Environment variables not set → Add them in Settings

### Environment Variables Not Working

**Symptoms:**
- Supabase connection errors
- "Invalid API key" errors
- Blank dashboard

**Solution:**
1. Verify variables are set correctly in Vercel Settings
2. Ensure variables are enabled for Production environment
3. **Redeploy** the application (variables only apply after redeploy)
4. Check variable names match exactly (case-sensitive)

### Supabase Connection Issues

**Verify:**
- ✅ Supabase URL is correct (no trailing slash)
- ✅ Anon key is the **public** anon key (not service role key)
- ✅ Database schema is migrated
- ✅ Seed data is loaded
- ✅ RLS policies are configured correctly

**Test locally first:**
```bash
# Create .env.local file
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Run locally
npm run dev
```

### Need to Redeploy

**Manual redeploy:**
1. Go to Vercel Dashboard → Deployments
2. Find the latest successful deployment
3. Click three dots (•••) → **Redeploy**
4. Confirm redeployment

## Custom Domain (Optional)

To add a custom domain:

1. Go to Project Settings → **Domains**
2. Click **Add**
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait for DNS propagation (up to 48 hours)

## Production Checklist

Before going live, ensure:

- ✅ Environment variables configured
- ✅ Build succeeds without errors
- ✅ All features tested on production URL
- ✅ Authentication works correctly
- ✅ Database connections stable
- ✅ No console errors in browser
- ✅ Performance is acceptable
- ✅ Mobile responsiveness verified

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/app/building-your-application/deploying)
- [Supabase Documentation](https://supabase.com/docs)

## Project Configuration

This project includes:
- ✅ `vercel.json` - Vercel configuration
- ✅ `next.config.ts` - Next.js configuration
- ✅ `.env.example` - Environment variable template

## Deployment Status

After successful deployment, your application will be available at:
- **Production**: `https://your-project.vercel.app`
- **Preview**: Automatic preview URLs for each branch/PR

---

**Need Help?** Check the troubleshooting section above or review Vercel deployment logs for specific error messages.
