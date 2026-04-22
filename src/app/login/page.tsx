'use client'
// src/app/login/page.tsx
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

function LoginForm() {
  const { signIn, signInMagic } = useAuth()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirectTo') ?? '/dashboard'
  const callbackErr  = searchParams.get('error')

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(callbackErr ? 'Authentication failed. Please try again.' : null)
  const [magicSent, setMagicSent] = useState(false)
  const [mode,      setMode]      = useState<'password' | 'magic'>('password')

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await signIn(email, password)
    if (error) { setError(error); setLoading(false) }
    else router.push(redirectTo)
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await signInMagic(email)
    if (error) { setError(error); setLoading(false) }
    else { setMagicSent(true); setLoading(false) }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px', outline: 'none', background: '#fff', color: '#1a1a1a' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 500, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }

  if (magicSent) return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>📧</div>
      <div style={{ fontWeight: 500, marginBottom: '8px' }}>Check your email</div>
      <div style={{ fontSize: '13px', color: '#666' }}>We sent a sign-in link to <strong>{email}</strong>.<br />Click the link to sign in.</div>
      <button onClick={() => setMagicSent(false)} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#1D9E75', cursor: 'pointer', fontSize: '13px' }}>Try a different email</button>
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', marginBottom: '20px', border: '0.5px solid #e0e0d8', borderRadius: '8px', overflow: 'hidden' }}>
        {(['password', 'magic'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '8px', border: 'none', background: mode === m ? '#E1F5EE' : 'transparent', color: mode === m ? '#0F6E56' : '#666', fontWeight: mode === m ? 500 : 400, fontSize: '12px', cursor: 'pointer' }}>
            {m === 'password' ? 'Password' : 'Magic Link'}
          </button>
        ))}
      </div>
      {error && <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', fontSize: '13px', color: '#A32D2D' }}>{error}</div>}
      <form onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink}>
        <div style={{ marginBottom: '14px' }}>
          <label style={lbl}>Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" style={inp} />
        </div>
        {mode === 'password' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={lbl}>Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inp} />
          </div>
        )}
        {mode === 'magic' && <div style={{ fontSize: '12px', color: '#888', marginBottom: '20px' }}>We&apos;ll send a one-click sign-in link to your email.</div>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', background: loading ? '#9FE1CB' : '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Please wait…' : mode === 'password' ? 'Sign in' : 'Send magic link'}
        </button>
      </form>
    </>
  )
}

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f6', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#1D9E75', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Project Controls</div>
          <div style={{ fontSize: '22px', fontWeight: 600, color: '#1a1a1a' }}>Construction ERP</div>
          <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>Sign in to your account</div>
        </div>
        <div style={{ background: '#fff', border: '0.5px solid #e0e0d8', borderRadius: '12px', padding: '28px' }}>
          <Suspense fallback={<div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '13px' }}>Loading…</div>}>
            <LoginForm />
          </Suspense>
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#aaa' }}>Project Controls System v1.0</div>
      </div>
    </div>
  )
}
