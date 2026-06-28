'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function StaffLogin() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lang, setLang] = useState<'en' | 'te'>('te')

  const t = {
    en: {
      welcome: 'Welcome Back',
      sub: 'Sri Varuni Staff Training',
      label: 'Your Name',
      placeholder: 'Enter your name',
      btn: 'Continue',
      loading: 'Finding your profile...',
      err: 'Name not found. Please check spelling or ask your manager.',
    },
    te: {
      welcome: 'తిరిగి స్వాగతం',
      sub: 'శ్రీ వరుణి సిబ్బంది శిక్షణ',
      label: 'మీ పేరు',
      placeholder: 'మీ పేరు నమోదు చేయండి',
      btn: 'కొనసాగించు',
      loading: 'మీ వివరాలు వెతుకుతున్నాం...',
      err: 'పేరు కనుగొనబడలేదు. స్పెల్లింగ్ తనిఖీ చేయండి లేదా మేనేజర్‌ను అడగండి.',
    }
  }[lang]

  async function handleLogin() {
    if (!name.trim()) return
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase
      .from('staff')
      .select('id, name, role, active')
      .ilike('name', name.trim())
      .eq('active', true)
      .single()

    if (err || !data) {
      setError(t.err)
      setLoading(false)
      return
    }
    localStorage.setItem('sv_staff', JSON.stringify(data))
    localStorage.setItem('sv_lang', lang)
    router.push('/staff/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--plum)' }}>
      {/* Header */}
      <div className="flex justify-between items-center px-6 pt-8 pb-4">
        <div>
          <div className="text-xs font-medium tracking-widest uppercase mb-1"
            style={{ color: 'var(--gold)' }}>Sri Varuni Jewellery</div>
          <div className="text-white text-xl font-semibold"
            style={{ fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
            {t.sub}
          </div>
        </div>
        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === 'en' ? 'te' : 'en')}
          className="text-sm px-3 py-1.5 rounded-full border font-medium transition-all"
          style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
          {lang === 'en' ? 'తెలుగు' : 'English'}
        </button>
      </div>

      {/* Gold divider */}
      <div className="mx-6 mb-8" style={{ height: 1, background: 'var(--gold)', opacity: 0.3 }} />

      {/* Logo area */}
      <div className="flex flex-col items-center px-6 mb-10">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(201,147,58,0.15)', border: '2px solid var(--gold)' }}>
          <span className="text-3xl">💎</span>
        </div>
        <h1 className="text-white text-2xl font-bold mb-1"
          style={{ fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
          {t.welcome}
        </h1>
      </div>

      {/* Login card */}
      <div className="mx-4 rounded-2xl p-6 flex-1"
        style={{ background: 'var(--ivory)' }}>
        <label className="block text-sm font-medium mb-2"
          style={{ color: 'var(--muted)', fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
          {t.label}
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder={t.placeholder}
          className="w-full px-4 py-3 rounded-xl text-base outline-none mb-4"
          style={{
            background: 'var(--rose)',
            border: '1.5px solid var(--border)',
            color: 'var(--charcoal)',
            fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif'
          }}
        />

        {error && (
          <div className="text-sm mb-4 px-3 py-2 rounded-lg"
            style={{ background: '#FEE2E2', color: 'var(--danger)',
              fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading || !name.trim()}
          className="w-full py-3.5 rounded-xl font-semibold text-white transition-all"
          style={{
            background: loading || !name.trim() ? 'var(--muted)' : 'var(--plum)',
            fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif'
          }}>
          {loading ? t.loading : t.btn}
        </button>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--muted)' }}>
          Having trouble? Ask your store manager.
        </p>
      </div>
    </div>
  )
}
