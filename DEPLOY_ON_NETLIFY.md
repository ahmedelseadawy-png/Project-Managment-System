# Deploy on Netlify

## 1) Import the project
- Log in to Netlify
- Add new site > Import an existing project
- Upload this folder or connect your repo

## 2) Build settings
- Build command: `npm run build`
- Publish directory: `.next`
- Node version: `20`

## 3) Environment variables
Add these in Netlify Site settings > Environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_AUTH_REDIRECT_URL`

Recommended callback value:
- `https://YOUR-NETLIFY-SITE.netlify.app/auth/callback`

## 4) Supabase Auth settings
In Supabase Authentication settings, add:
- your Netlify site URL
- the callback URL `/auth/callback`

## 5) Deploy
Trigger a new deploy after saving variables.

If build still fails, check the Netlify build log for the next TypeScript error.
