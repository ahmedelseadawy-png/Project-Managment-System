#!/bin/bash
# ============================================================
# PROJECT CONTROLS SYSTEM — Apply all Netlify build fixes
# Run this from your project root (where package.json lives):
#   bash apply-fixes.sh
# Then: git add -A && git commit -m "fix: all Netlify build errors" && git push
# ============================================================

set -e
echo "Applying all Netlify build fixes..."

# ── FIX 1: src/app/auth/callback/route.ts ───────────────────
cat > src/app/auth/callback/route.ts << 'EOF'
// src/app/auth/callback/route.ts
import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

type CookieItem = Parameters<NonNullable<CookieMethodsServer['setAll']>>[0][number]

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code       = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: CookieItem[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${redirectTo}`)
  }
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
EOF
echo "✓ src/app/auth/callback/route.ts"

# ── FIX 2: src/lib/supabase/server.ts ───────────────────────
cat > src/lib/supabase/server.ts << 'EOF'
// src/lib/supabase/server.ts
import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

type CookieItem = Parameters<NonNullable<CookieMethodsServer['setAll']>>[0][number]

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: CookieItem[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
EOF
echo "✓ src/lib/supabase/server.ts"

# ── FIX 3: middleware.ts ─────────────────────────────────────
cat > middleware.ts << 'EOF'
// middleware.ts — project root
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/auth/callback', '/auth/confirm']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
EOF
echo "✓ middleware.ts"

# ── FIX 4: rename useAuth.ts → useAuth.tsx (JSX in .ts) ─────
if [ -f "src/hooks/useAuth.ts" ] && [ ! -f "src/hooks/useAuth.tsx" ]; then
  mv src/hooks/useAuth.ts src/hooks/useAuth.tsx
  echo "✓ renamed useAuth.ts → useAuth.tsx"
else
  echo "✓ useAuth.tsx already correct"
fi

# ── FIX 5: rename useProject.ts → useProject.tsx ────────────
if [ -f "src/hooks/useProject.ts" ] && [ ! -f "src/hooks/useProject.tsx" ]; then
  mv src/hooks/useProject.ts src/hooks/useProject.tsx
  echo "✓ renamed useProject.ts → useProject.tsx"
else
  echo "✓ useProject.tsx already correct"
fi

# ── FIX 6: useEffect import in queries/index.ts ─────────────
# Replace wrong @tanstack import with correct react import
if grep -q "useEffect.*@tanstack/react-query\|from '@tanstack/react-query'.*useEffect" src/hooks/queries/index.ts 2>/dev/null; then
  sed -i "s/import { useQuery, useMutation, useQueryClient, useEffect } from '@tanstack\/react-query'/import { useEffect } from 'react'\nimport { useQuery, useMutation, useQueryClient } from '@tanstack\/react-query'/" src/hooks/queries/index.ts
  echo "✓ fixed useEffect import in queries/index.ts"
else
  echo "✓ useEffect import already correct"
fi

echo ""
echo "All fixes applied. Now run:"
echo "  git add -A"
echo "  git commit -m \"fix: all Netlify build errors\""
echo "  git push"
