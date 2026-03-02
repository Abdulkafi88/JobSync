# JobSync Setup Guide

## What I've Done

✅ Updated `.env` file with your new Supabase credentials
✅ Updated `supabase/config.toml` with your new project ID
✅ Created GitHub Actions workflow for automatic deployment
✅ Improved error handling and user feedback

## What You Need to Do

### Step 1: Deploy the Edge Function

You need to deploy the `analyze-resume` Edge Function to your Supabase project. Here are two ways to do it:

#### Option A: Using Supabase CLI (Recommended)

1. **Get your Supabase access token:**
   - Go to: https://supabase.com/dashboard/account/tokens
   - Click "Generate new token"
   - Give it a name like "JobSync CLI"
   - Copy the token

2. **Set the token in your terminal:**
   ```bash
   export SUPABASE_ACCESS_TOKEN="your-token-here"
   ```

3. **Link your project:**
   ```bash
   npx supabase link --project-ref fxafkfzjbeycyoozezfo
   ```

4. **Deploy the function:**
   ```bash
   npx supabase functions deploy analyze-resume
   ```

#### Option B: Using Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/fxafkfzjbeycyoozezfo/functions
2. Click "Deploy a new function"
3. Follow the dashboard instructions

### Step 2: Configure the API Key Secret

The Edge Function needs a `LOVABLE_API_KEY` to work. You have two options:

#### Option A: Use Lovable AI Gateway (Current Setup)

1. Get your Lovable API key from: https://lovable.dev
2. Go to: https://supabase.com/dashboard/project/fxafkfzjbeycyoozezfo/settings/functions
3. Under "Secrets", click "Add new secret"
4. Add:
   - Name: `LOVABLE_API_KEY`
   - Value: Your Lovable API key

#### Option B: Use Google Gemini API Directly (Free Alternative)

If you don't have access to Lovable, I can help you modify the Edge Function to use Google's Gemini API directly:

1. Get a free Google Gemini API key from: https://ai.google.dev/
2. Let me know, and I'll update the Edge Function code
3. Deploy the modified function
4. Add the secret as `GOOGLE_GEMINI_API_KEY` instead

### Step 3: Test Locally

Once the Edge Function is deployed and the secret is configured:

```bash
npm run dev
```

Then:
1. Enter a job description in the left textarea
2. Enter your resume/skills in the right textarea (or upload a PDF)
3. Click "Analyze with AI"
4. You should see analysis results appear below

### Step 4: Configure GitHub Repository Secrets

For automatic deployment to GitHub Pages:

1. Go to your GitHub repository
2. Navigate to: Settings → Secrets and variables → Actions
3. Click "New repository secret" for each of these:
   - Name: `VITE_SUPABASE_URL`
     Value: `https://fxafkfzjbeycyoozezfo.supabase.co`
   - Name: `VITE_SUPABASE_PUBLISHABLE_KEY`
     Value: `sb_publishable_SphsL0p-B-e9rrwrlbgV9A_S2PVdvSy`
   - Name: `VITE_SUPABASE_PROJECT_ID`
     Value: `fxafkfzjbeycyoozezfo`

### Step 5: Enable GitHub Pages

1. Go to: Repository Settings → Pages
2. Under "Build and deployment":
   - Source: GitHub Actions
3. The deployment will happen automatically when you push to main

### Step 6: Deploy to GitHub Pages

```bash
git add .
git commit -m "Configure Supabase and deploy Edge Function"
git push origin main
```

The GitHub Actions workflow will automatically build and deploy your site.

## Troubleshooting

### Error: "Cannot connect to the analysis service"

- Check that the Edge Function is deployed in your Supabase dashboard
- Verify the `LOVABLE_API_KEY` secret is set correctly
- Check the Edge Function logs in Supabase for errors

### Error: "The analysis service is not properly configured"

- Verify your `.env` file has the correct values
- Rebuild the app: `npm run build`
- Restart the dev server: `npm run dev`

### Error: "Network error: Unable to reach the analysis service"

- Check your internet connection
- Verify the Supabase URL is correct: https://fxafkfzjbeycyoozezfo.supabase.co
- Check if your Supabase project is active in the dashboard

## Files Modified

- `.env` - Updated with new Supabase credentials
- `supabase/config.toml` - Updated project ID
- `.github/workflows/deploy.yml` - Created deployment workflow
- `src/integrations/supabase/client.ts` - Improved error logging
- `src/pages/Index.tsx` - Better error handling and user feedback

## Next Steps After Setup

Once everything is working:
1. Test the analysis with different job descriptions and resumes
2. Customize the UI if needed
3. Monitor the Edge Function logs in Supabase
4. Check GitHub Actions for successful deployments

## Need Help?

If you encounter issues:
1. Check the browser console (F12) for detailed error messages
2. Check Supabase Edge Function logs
3. Verify all environment variables are set correctly
4. Let me know what error you're seeing, and I'll help debug!
