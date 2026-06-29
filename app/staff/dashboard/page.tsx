'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Assignment, type Certificate } from '@/lib/supabase'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:     { label: 'Pending',     cls: 'badge badge-pending' },
    in_progress: { label: 'In Progress', cls: 'badge badge-progress' },
    completed:   { label: 'Completed',   cls: 'badge badge-completed' },
    overdue:     { label: 'Overdue',     cls: 'badge badge-overdue' },
  }
  const s = map[status] || map.pending
  return <span className={s.cls}>{s.label}</span>
}

export default function StaffDashboard() {
  const router = useRouter()
  const [staff, setStaff] = useState<any>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [tab, setTab] = useState<'courses' | 'history'>('courses')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = localStorage.getItem('sv_staff')
    if (!s) { router.push('/staff'); return }
    setStaff(JSON.parse(s))
  }, [])

  useEffect(() => {
    if (!staff) return
    fetchData()
  }, [staff])

  async function fetchData() {
    setLoading(true)
    const { data: asgn } = await supabase
      .from('lms_assignments')
      .select('*, course:lms_courses(id,title_en,description_en,pass_threshold,status)')
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

  const active = assignments.filter(a => a.status !== 'completed')
  const done   = assignments.filter(a => a.status === 'completed')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)', paddingBottom: 40 }}>
      <div className="nav-bar">
        <div>
          <span className="nav-brand">Sri Varuni Jewellery</span>
          <span className="nav-title">{staff ? `Hello, ${staff.name.split(' ')[0]}` : 'My Training'}</span>
        </div>
        <button onClick={() => { localStorage.removeItem('sv_staff'); router.push('/staff') }}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '7px 14px', color: '#FFFFFF', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
          Sign out
        </button>
      </div>

      <div style={{ background: 'var(--plum)', padding: '0 20px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { num: assignments.length, label: 'Assigned' },
            { num: done.length,         label: 'Completed' },
            { num: certificates.length, label: 'Certificates' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <span className="stat-number">{s.num}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="tab-bar">
        {(['courses', 'history'] as const).map(t2 => (
          <button key={t2} className={`tab-btn ${tab === t2 ? 'active' : ''}`} onClick={() => setTab(t2)}>
            {t2 === 'courses' ? 'My Courses' : 'History'}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)', fontSize: 14 }}>
            Loading your courses...
          </div>
        )}

        {!loading && tab === 'courses' && (
          <>
            {active.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                <p style={{ color: 'var(--muted)', fontSize: 15 }}>No courses assigned yet.</p>
              </div>
            ) : active.map(a => (
              <div key={a.id} style={{ marginBottom: 12 }}>
                <button className="lesson-card" onClick={() => router.push(`/staff/course/${a.course_id}?assignment=${a.id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--charcoal)', lineHeight: 1.3 }}>
                      {a.course?.title_en}
                    </h3>
                    <StatusBadge status={a.status} />
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5 }}>
                    {a.course?.description_en}
                  </p>
                  {a.due_date && (
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                      Due: {new Date(a.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  <div style={{ background: 'var(--plum)', color: '#FFFFFF', borderRadius: 8, padding: '10px 14px', textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
                    {a.status === 'pending' ? 'Start course →' : 'Continue →'}
                  </div>
                </button>
              </div>
            ))}
          </>
        )}

        {!loading && tab === 'history' && (
          <>
            {done.map(a => (
              <div key={a.id} style={{ marginBottom: 10 }}>
                <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✓</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>{a.course?.title_en}</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {a.completed_at ? new Date(a.completed_at).toLocaleDateString('en-IN') : ''}
                    </p>
                  </div>
                  <StatusBadge status="completed" />
                </div>
              </div>
            ))}

            {certificates.map(c => (
              <div key={c.id} style={{ marginBottom: 10 }}>
                <div style={{ background: 'var(--plum)', borderRadius: 14, padding: '16px', border: '1.5px solid var(--gold-btn)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 28 }}>🏆</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold-btn)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Certificate</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF', marginTop: 2 }}>{staff?.name}</p>
                    {c.final_score && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Score: {c.final_score}%</p>}
                  </div>
                  <button style={{ background: 'var(--gold-btn)', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    View
                  </button>
                </div>
              </div>
            ))}

            {done.length === 0 && certificates.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                <p style={{ color: 'var(--muted)', fontSize: 15 }}>No completed courses yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
