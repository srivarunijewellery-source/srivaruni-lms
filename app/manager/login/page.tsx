'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ManagerLogin() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Manager logs in same way as staff — by name — but must have role manager/admin
  async function handleLogin() {
    const trimmed = name.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')

    const { data, error: err } = await supabase
      .from('profiles')
      .select('id, name, role, email')
      .ilike('name', `%${trimmed}%`)
      .in('role', ['manager', 'admin'])

    if (err || !data || data.length === 0) {
      setError('Name not found or you do not have manager access.')
      setLoading(false)
      return
    }

    localStorage.setItem('sv_manager', JSON.stringify(data[0]))
    router.replace('/manager/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1E0A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C9933A', marginBottom: 8 }}>Sri Varuni Jewellery</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>Manager Portal</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 8 }}>Sign in to view your team's progress</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 28 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Your Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Enter your name"
            style={{ width: '100%', padding: '12px 14px', fontSize: 15, border: '1.5px solid #D4CEC8', borderRadius: 10, outline: 'none', fontFamily: 'DM Sans, sans-serif', color: '#111', boxSizing: 'border-box', marginBottom: 16 }} />

          {error && (
            <div style={{ background: '#FDECEA', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#9B1C1C', marginBottom: 16, fontWeight: 500 }}>
              {error}
            </div>
          )}

          <button onClick={handleLogin} disabled={loading || !name.trim()}
            style={{ width: '100%', padding: 13, background: loading ? '#9A9A9A' : '#1E0A2E', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            {loading ? 'Signing in...' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}
