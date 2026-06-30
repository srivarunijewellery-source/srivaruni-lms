'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ManagerLogin() {
  const router = useRouter()
  const [branch, setBranch] = useState<'Boduppal' | 'Zahirabad' | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('sv_mgr_branch')
    if (saved === 'Boduppal' || saved === 'Zahirabad') setBranch(saved)
  }, [])

  function selectBranch(b: 'Boduppal' | 'Zahirabad') {
    setBranch(b); localStorage.setItem('sv_mgr_branch', b); setError('')
  }

  async function handleLogin() {
    const trimmed = name.trim()
    if (!trimmed || !branch) return
    setLoading(true)
    setError('')

    const { data, error: err } = await supabase
      .from('profiles')
      .select('id, name, role, email, branch')
      .ilike('name', `%${trimmed}%`)
      .in('role', ['manager', 'admin'])

    // Filter to managers at this branch, or admins with branch='All'
    const matched = (data || []).filter(p => p.branch === branch || p.branch === 'All')

    if (err || matched.length === 0) {
      setError('Name not found for this branch, or you do not have manager access.')
      setLoading(false)
      return
    }

    localStorage.setItem('sv_manager', JSON.stringify({ ...matched[0], selectedBranch: branch }))
    router.replace('/manager/dashboard')
  }

  if (!branch) {
    return (
      <div style={{ minHeight: '100vh', background: '#1E0A2E', display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ padding: '56px 28px 32px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9933A', marginBottom: 8 }}>Sri Varuni Jewellery</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: 0 }}>Manager Portal</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginTop: 8, fontSize: 14 }}>Select your branch to continue</p>
        </div>
        <div style={{ flex: 1, background: '#F7F5F2', borderRadius: '24px 24px 0 0', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(['Boduppal', 'Zahirabad'] as const).map(b => (
            <button key={b} onClick={() => selectBranch(b)}
              style={{ background: '#fff', border: '1.5px solid #D4CEC8', borderRadius: 14, padding: 20, textAlign: 'left', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#111' }}>{b}</div>
                <div style={{ fontSize: 13, color: '#5A5A5A', marginTop: 2 }}>Manage {b} branch staff</div>
              </div>
              <span style={{ fontSize: 22, color: '#C9933A' }}>›</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1E0A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <button onClick={() => setBranch(null)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '5px 12px', color: '#fff', fontSize: 12, cursor: 'pointer', marginBottom: 12, fontFamily: 'DM Sans, sans-serif' }}>
            ← Change branch
          </button>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C9933A', marginBottom: 8 }}>Sri Varuni Jewellery — {branch}</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>Manager Portal</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 8 }}>Sign in to view your team's progress</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 28 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Your Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Enter your name"
            style={{ width: '100%', padding: '12px 14px', fontSize: 15, border: '1.5px solid #D4CEC8', borderRadius: 10, outline: 'none', fontFamily: 'DM Sans, sans-serif', color: '#111', boxSizing: 'border-box', marginBottom: 16 }} />
          {error && <div style={{ background: '#FDECEA', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#9B1C1C', marginBottom: 16, fontWeight: 500 }}>{error}</div>}
          <button onClick={handleLogin} disabled={loading || !name.trim()}
            style={{ width: '100%', padding: 13, background: loading ? '#9A9A9A' : '#1E0A2E', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            {loading ? 'Signing in...' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}
