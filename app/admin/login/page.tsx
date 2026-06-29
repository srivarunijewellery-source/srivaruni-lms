'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email || !password) return
    setLoading(true)
    setError('')

    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err || !data.user) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    // Check if profile is admin or manager
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, role, email')
      .eq('id', data.user.id)
      .single()

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      setError('You do not have admin access.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    localStorage.setItem('sv_admin', JSON.stringify(profile))
    router.replace('/admin/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1E0A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C9933A', marginBottom: 8 }}>
            Sri Varuni Jewellery
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>Admin Portal</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 8 }}>Sign in to manage training</p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 32 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@srivaruni.com"
              style={{ width: '100%', padding: '12px 14px', fontSize: 15, border: '1.5px solid #D4CEC8', borderRadius: 10, outline: 'none', fontFamily: 'DM Sans, sans-serif', color: '#111', background: '#fff', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 14px', fontSize: 15, border: '1.5px solid #D4CEC8', borderRadius: 10, outline: 'none', fontFamily: 'DM Sans, sans-serif', color: '#111', background: '#fff', boxSizing: 'border-box' }} />
          </div>

          {error && (
            <div style={{ background: '#FDECEA', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#9B1C1C', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button onClick={handleLogin} disabled={loading || !email || !password}
            style={{ width: '100%', padding: '13px', background: loading ? '#9A9A9A' : '#1E0A2E', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>
        </div>
      </div>
    </div>
  )
}
