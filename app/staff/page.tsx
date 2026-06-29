'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function StaffLogin() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    const trimmed = name.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')

    const { data, error: err } = await supabase
      .from('staff')
      .select('id, name, role, active')
      .ilike('name', `%${trimmed}%`)
      .eq('active', true)

    if (err || !data || data.length === 0) {
      setError('Name not found. Check spelling or ask your manager.')
      setLoading(false)
      return
    }

    localStorage.setItem('sv_staff', JSON.stringify(data[0]))
    router.push('/staff/dashboard')
  }

  const staffNames = ['Aarithi','D Mamatha','G Jyothi','J Revathi','Lingamma','MD Asia','Ramesh','U Latha','Vijay Krishna']

  return (
    <div style={{ minHeight: '100vh', background: 'var(--plum)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '48px 28px 32px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-btn)', marginBottom: 8 }}>
          Sri Varuni Jewellery
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2 }}>
          Staff Training Portal
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', marginTop: 8, fontSize: 14 }}>
          Sign in to view your assigned courses
        </p>
      </div>

      <div style={{ flex: 1, background: 'var(--ivory)', borderRadius: '24px 24px 0 0', padding: '32px 24px 40px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 24 }}>
          Enter your name
        </h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="e.g. D Mamatha"
            style={{ width: '100%', padding: '14px 16px', fontSize: 16, border: '1.5px solid var(--border)', borderRadius: 10, background: 'var(--white)', color: 'var(--charcoal)', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
          />
        </div>

        {error && (
          <div style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 14, marginBottom: 16, fontWeight: 500 }}>
            {error}
          </div>
        )}

        <button className="btn-primary" onClick={handleLogin} disabled={loading || !name.trim()}>
          {loading ? 'Finding your profile...' : 'Continue →'}
        </button>

        <div style={{ marginTop: 28, padding: '16px', background: 'var(--rose-bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Tap your name
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {staffNames.map(n => (
              <button key={n} onClick={() => setName(n)}
                style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border-dark)', background: 'var(--white)', color: 'var(--body)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
