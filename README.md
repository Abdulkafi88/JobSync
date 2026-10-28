# JobSync

**AI resume analyzer that compares your resume to a job posting, scores the match, and tells you exactly what to improve.**

🔗 **Live demo:** https://abdulkafi88.github.io/JobSync/

## Features

- **Paste or upload:** paste a job description and your resume, or upload your resume as a PDF (text is extracted in the browser)
- **Match score:** a strict 0–100 score based on how many of the job's requirements your resume meets
- **Matching skills:** the skills and qualifications from your resume that fit the role
- **Missing keywords:** important skills and tools from the posting that your resume doesn't show
- **Tailored tips:** 5–8 specific, actionable suggestions for improving your resume for that exact job

## How it works

```
Browser (React)  ──►  Supabase Edge Function  ──►  Groq API (gpt-oss-120b)
   job + resume          holds the API key           returns JSON analysis
```

The browser never sees the Groq API key. Requests go through a Supabase Edge Function (`supabase/functions/analyze-resume`) that holds the key, validates input size, restricts which sites can call it (CORS), and checks the AI's response before returning it.

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **PDF parsing:** pdf.js
- **Backend:** Supabase Edge Functions (Deno)
- **AI:** Groq API (`openai/gpt-oss-120b`)
- **Hosting:** GitHub Pages, deployed with GitHub Actions

## Running locally

Requires Node.js 20+.

```sh
git clone https://github.com/Abdulkafi88/JobSync.git
cd JobSync
npm install
cp .env.example .env   # then fill in your Supabase values
npm run dev
```

### Environment variables

| Variable | Where it goes | Description |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | `.env` / GitHub secret | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env` / GitHub secret | Supabase publishable key (safe to expose) |
| `GROQ_API_KEY` | Supabase function secret | Groq API key; never put this in `.env` |

### Deploying the Edge Function

```sh
supabase login
supabase link --project-ref <your-project-id>
supabase secrets set GROQ_API_KEY=<your-groq-key>
supabase functions deploy analyze-resume --no-verify-jwt
```

## Deployment

Pushing to `main` triggers the GitHub Actions workflow in `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages.
