'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Assignment, type Certificate } from '@/lib/supabase'

function ProgressRing({ percent, size = 56 }: { percent: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="#E2D8E8" strokeWidth="4" />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="#C9933A" strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        className="progress-ring" style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fontSize="11" fontWeight="600" fill="#2D1B35">
        {percent}%
      </text>
    </svg>
  )
}

function StatusBadge({ status, lang }: { status: string; lang: string }) {
  const labels: Record<string, { en: string; te: string; cls: string }> = {
    pending:    { en: 'Pending',     te: 'పెండింగ్',    cls: 'badge-pending' },
    in_progress:{ en: 'In Progress', te: 'జరుగుతోంది',  cls: 'badge-progress' },
    completed:  { en: 'Completed',   te: 'పూర్తయింది',  cls: 'badge-completed' },
    overdue:    { en: 'Overdue',     te: 'గడువు మించింది', cls: 'badge-overdue' },
  }
  const s = labels[status] || labels.pending
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>
      {lang === 'te' ? s.te : s.en}
    </span>
  )
}

export default function StaffDashboard() {
  const router = useRouter()
  const [staff, setStaff] = useState<any>(null)
  const [lang, setLang] = useState<'en' | 'te'>('te')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [tab, setTab] = useState<'courses' | 'history'>('courses')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = localStorage.getItem('sv_staff')
    const l = localStorage.getItem('sv_lang') as 'en' | 'te'
    if (!s) { router.push('/staff'); return }
    setStaff(JSON.parse(s))
    if (l) setLang(l)
  }, [])

  useEffect(() => {
    if (!staff) return
    fetchData()
  }, [staff])

  async function fetchData() {
    setLoading(true)
    const { data: asgn } = await supabase
      .from('lms_assignments')
      .select('*, course:lms_courses(id,title_en,title_te,description_en,description_te,pass_threshold,status)')
      .eq('staff_id', staff.id)
      .order('assigned_at', { ascending: false })

    const { data: certs } = await supabase
      .from('lms_certificates')
      .select('*')
      .eq('staff_id', staff.id)
      .order('issued_at', { ascending: false })

    setAssignments((asgn || []) as Assignment[])
    setCertificates(certs || [])
    setLoading(false)
  }

  function logout() {
    localStorage.removeItem('sv_staff')
    router.push('/staff')
  }

  const t = {
    en: { greeting: 'Hello', courses: 'My Courses', history: 'History',
          noCourses: 'No courses assigned yet.', noCerts: 'No certificates yet.',
          start: 'Start', continue: 'Continue', review: 'Review',
          due: 'Due', score: 'Score', issued: 'Issued' },
    te: { greeting: 'నమస్కారం', courses: 'నా కోర్సులు', history: 'చరిత్ర',
          noCourses: 'ఇంకా కోర్సులు కేటాయించబడలేదు.', noCerts: 'ఇంకా సర్టిఫికెట్లు లేవు.',
          start: 'ప్రారంభించు', continue: 'కొనసాగించు', review: 'సమీక్షించు',
          due: 'గడువు', score: 'స్కోర్', issued: 'జారీ చేయబడింది' },
  }[lang]

  const active = assignments.filter(a => a.status !== 'completed')
  const done   = assignments.filter(a => a.status === 'completed')

  return (
    <div className="min-h-screen" style={{ background: 'var(--ivory)' }}>
      {/* Top nav */}
      <div className="px-4 pt-6 pb-4" style={{ background: 'var(--plum)' }}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-xs tracking-widest uppercase mb-0.5"
              style={{ color: 'var(--gold)' }}>Sri Varuni Jewellery</div>
            <h1 className="text-white text-lg font-semibold"
              style={{ fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
              {t.greeting}{staff ? `, ${staff.name.split(' ')[0]}` : ''}
            </h1>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => {
              const nl = lang === 'en' ? 'te' : 'en'
              setLang(nl); localStorage.setItem('sv_lang', nl)
            }}
              className="text-xs px-2.5 py-1 rounded-full border"
              style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
              {lang === 'en' ? 'తెలుగు' : 'EN'}
            </button>
            <button onClick={logout}
              className="text-xs px-2.5 py-1 rounded-full border"
              style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.7)' }}>
              ↩
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 pb-2">
          {[
            { num: assignments.length, label: lang === 'te' ? 'కేటాయించబడ్డవి' : 'Assigned' },
            { num: done.length,        label: lang === 'te' ? 'పూర్తయినవి' : 'Completed' },
            { num: certificates.length,label: lang === 'te' ? 'సర్టిఫికెట్లు' : 'Certificates' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--gold)' }}>{s.num}</div>
              <div className="text-xs mt-0.5" style={{
                color: 'rgba(255,255,255,0.7)',
                fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif'
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b px-4" style={{ background: 'white', borderColor: 'var(--border)' }}>
        {(['courses', 'history'] as const).map(t2 => (
          <button key={t2} onClick={() => setTab(t2)}
            className="flex-1 py-3 text-sm font-medium transition-all"
            style={{
              color: tab === t2 ? 'var(--plum)' : 'var(--muted)',
              borderBottom: tab === t2 ? '2px solid var(--gold)' : '2px solid transparent',
              fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif'
            }}>
            {t2 === 'courses' ? t.courses : t.history}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {loading && (
          <div className="text-center py-12" style={{ color: 'var(--muted)' }}>
            <div className="text-2xl mb-2">⏳</div>
            <div className="text-sm">{lang === 'te' ? 'లోడ్ అవుతోంది...' : 'Loading...'}</div>
          </div>
        )}

        {/* COURSES TAB */}
        {!loading && tab === 'courses' && (
          <>
            {active.length === 0 ? (
              <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
                <div className="text-4xl mb-3">🎉</div>
                <div style={{ fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
                  {t.noCourses}
                </div>
              </div>
            ) : active.map(a => (
              <div key={a.id}
                className="bg-white rounded-2xl p-4 card-hover cursor-pointer"
                style={{ border: '1px solid var(--border)' }}
                onClick={() => router.push(`/staff/course/${a.course_id}?assignment=${a.id}`)}>
                <div className="flex items-start gap-3">
                  <ProgressRing percent={a.status === 'in_progress' ? 45 : a.status === 'completed' ? 100 : 0} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm leading-snug"
                        style={{ color: 'var(--plum)',
                          fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
                        {lang === 'te' ? a.course?.title_te : a.course?.title_en}
                      </h3>
                      <StatusBadge status={a.status} lang={lang} />
                    </div>
                    <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--muted)',
                      fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
                      {lang === 'te' ? a.course?.description_te : a.course?.description_en}
                    </p>
                    {a.due_date && (
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>
                        {t.due}: {new Date(a.due_date).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <button className="w-full py-2 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'var(--plum)',
                      fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
                    {a.status === 'pending' ? t.start : t.continue} →
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* HISTORY TAB */}
        {!loading && tab === 'history' && (
          <>
            {/* Completed courses */}
            {done.map(a => (
              <div key={a.id} className="bg-white rounded-2xl p-4"
                style={{ border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{ background: '#D1FAE5' }}>✓</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--plum)',
                      fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
                      {lang === 'te' ? a.course?.title_te : a.course?.title_en}
                    </h3>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {a.completed_at ? new Date(a.completed_at).toLocaleDateString('en-IN') : ''}
                    </div>
                  </div>
                  <StatusBadge status="completed" lang={lang} />
                </div>
              </div>
            ))}

            {/* Certificates */}
            {certificates.map(c => (
              <div key={c.id} className="rounded-2xl p-4"
                style={{ background: 'linear-gradient(135deg, var(--plum) 0%, #4A2558 100%)',
                  border: '1px solid var(--gold)' }}>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🏆</div>
                  <div className="flex-1">
                    <div className="text-xs mb-0.5" style={{ color: 'var(--gold)' }}>
                      {lang === 'te' ? 'సర్టిఫికెట్' : 'Certificate'}
                    </div>
                    <div className="text-white font-semibold text-sm">{staff?.name}</div>
                    {c.final_score && (
                      <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        {t.score}: {c.final_score}%
                      </div>
                    )}
                  </div>
                  <button className="text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{ background: 'var(--gold)', color: 'white' }}>
                    {lang === 'te' ? 'చూడు' : 'View'}
                  </button>
                </div>
              </div>
            ))}

            {done.length === 0 && certificates.length === 0 && (
              <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
                <div className="text-4xl mb-3">📚</div>
                <div style={{ fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
                  {t.noCerts}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
