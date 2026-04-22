# Project Controls System

Connected to Supabase project: **ookeknlxwixpehsbguze**
URL: https://ookeknlxwixpehsbguze.supabase.co

---

## Run locally

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open http://localhost:3000
#    You will be redirected to /login
#    Sign in with a user you created in Supabase Dashboard → Auth → Users
```

## Before running — Supabase setup checklist

- [ ] Run `supabase/project_controls_schema.sql` in Supabase SQL Editor
- [ ] Run `storage-buckets.sql` in Supabase SQL Editor  
- [ ] Create at least one user in Supabase Dashboard → Authentication → Users
- [ ] Run this SQL to assign that user to the seed project:

```sql
INSERT INTO public.users (id, email, full_name, role)
SELECT id, email, email, 'Admin'
FROM auth.users
WHERE email = 'your@email.com'
ON CONFLICT (id) DO UPDATE SET role = 'Admin';

INSERT INTO public.project_users (project_id, user_id, role)
SELECT p.id, u.id, 'Admin'
FROM public.projects p, public.users u
WHERE p.project_code = 'GN' AND u.email = 'your@email.com'
ON CONFLICT (project_id, user_id) DO NOTHING;
```

## Deploy Edge Function

```bash
npx supabase login
npx supabase link --project-ref ookeknlxwixpehsbguze
npx supabase functions deploy generate-certificate
```

## Type check

```bash
npm run typecheck
```

## Project structure

```
src/
├── app/
│   ├── layout.tsx              Root layout (providers)
│   ├── page.tsx                Redirects to /dashboard
│   ├── login/page.tsx          Login page (password + magic link)
│   ├── dashboard/page.tsx      Main dashboard (live Supabase data)
│   └── auth/callback/route.ts  Email confirmation handler
├── hooks/
│   ├── useAuth.ts              Auth context + sign in/out
│   ├── useProject.ts           Active project context
│   └── queries/index.ts        All 10 data hooks
├── lib/
│   ├── query-keys.ts           React Query cache keys
│   ├── query-provider.tsx      React Query setup
│   └── supabase/
│       ├── client.ts           Browser client
│       ├── server.ts           Server client
│       ├── admin.ts            Service role client
│       ├── helpers.ts          unwrap / error helpers
│       └── storage.ts          File upload helpers
└── types/
    ├── database.ts             All table/view TypeScript types
    └── certificate-engine.ts   Certificate engine types

supabase/functions/
├── _shared/
│   ├── types.ts
│   ├── cors.ts
│   └── engine.ts               Pure calculation logic
└── generate-certificate/
    └── index.ts                Edge Function handler

middleware.ts                   Auth guard (project root)
.env.local                      Credentials (never commit)
```
