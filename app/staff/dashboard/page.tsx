'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function Badge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending:     ['Pending',     'badge badge-pending'],
    in_progress: ['In Progress', 'badge badge-progress'],
    completed:   ['Completed',   'badge badge-completed'],
    overdue:     ['Overdue',     'badge badge-overdue'],
  }
  const [label, cls] = map[status] || map.pending
  return <span className={cls}>{label}</span>
}

export default function StaffDashboard() {
  const router = useRouter()
  const [staff, setStaff]         = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [results, setResults]     = useState<any[]>([])
  const [tab, setTab]             = useState<'courses' | 'history'>('courses')
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const s = localStorage.getItem('sv_staff')
    if (!s) { router.replace('/staff'); return }
    setStaff(JSON.parse(s))
  }, [])

  useEffect(() => { if (staff) load() }, [staff])

  async function load() {
    setLoading(true)
    const [{ data: asgn }, { data: res }] = await Promise.all([
      supabase
        .from('lms_assignments')
        .select('id, course_id, status, due_date, assigned_at, completed_at, course:lms_courses(title_en, description_en, pass_threshold)')
        .eq('staff_id', staff.id)
        .order('assigned_at', { ascending: false }),
      supabase
        .from('lms_results')
        .select('id, score, passed, completed_at, content:lms_content(title_en)')
        .eq('staff_id', staff.id)
        .order('completed_at', { ascending: false }),
    ])
    setAssignments(asgn || [])
    setResults(res || [])
    setLoading(false)
  }

  const pending   = assignments.filter(a => a.status !== 'completed')
  const completed = assignments.filter(a => a.status === 'completed')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)', paddingBottom: 40 }}>
      {/* Nav */}
      <div className="nav-bar">
        <div>
          <span className="nav-brand">Sri Varuni Jewellery</span>
          <span className="nav-title">
            {staff ? `Hello, ${staff.name.split(' ')[0]}` : 'My Training'}
          </span>
        </div>
        <button onClick={() => { localStorage.removeItem('sv_staff'); router.replace('/staff') }}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '7px 14px', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
          Sign out
        </button>
      </div>

      {/* Stats */}
      <div style={{ background: 'var(--plum)', padding: '0 20px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { num: assignments.length, label: 'Assigned' },
            { num: completed.length,   label: 'Completed' },
            { num: results.length,     label: 'Quizzes taken' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <span className="stat-number">{s.num}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab-btn${tab === 'courses' ? ' active' : ''}`} onClick={() => setTab('courses')}>
          My Courses {pending.length > 0 && <span style={{ background: 'var(--gold-btn)', color: '#fff', borderRadius: '50%', fontSize: 11, padding: '1px 6px', marginLeft: 4 }}>{pending.length}</span>}
        </button>
        <button className={`tab-btn${tab === 'history' ? ' active' : ''}`} onClick={() => setTab('history')}>
          History
        </button>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {loading && <p style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>Loading...</p>}

        {/* COURSES TAB */}
        {!loading && tab === 'courses' && (
          <>
            {assignments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                <p style={{ color: 'var(--muted)', fontSize: 15 }}>No courses assigned yet.</p>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>Ask your manager to assign a course.</p>
              </div>
            ) : assignments.map(a => (
              <div key={a.id} style={{ marginBottom: 12 }}>
                <button className={`lesson-card${a.status === 'completed' ? ' completed' : ''}`}
                  onClick={() => router.push(`/staff/course/${a.course_id}?assignment=${a.id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--charcoal)', lineHeight: 1.3, flex: 1 }}>
                      {a.course?.title_en}
                    </h3>
                    <Badge status={a.status} />
                  </div>

                  {a.course?.description_en && (
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.5 }}>
                      {a.course.description_en}
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {a.due_date && (
                      <p style={{ fontSize: 12, color: new Date(a.due_date) < new Date() && a.status !== 'completed' ? 'var(--danger-text)' : 'var(--muted)' }}>
                        {new Date(a.due_date) < new Date() && a.status !== 'completed' ? '⚠️ ' : ''}
                        Due: {new Date(a.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                    {a.course?.pass_threshold && (
                      <p style={{ fontSize: 12, color: 'var(--muted)' }}>Pass mark: {a.course.pass_threshold}%</p>
                    )}
                  </div>

                  <div style={{ background: a.status === 'completed' ? 'var(--success-text)' : 'var(--plum)', color: '#fff', borderRadius: 8, padding: '10px 14px', textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
                    {a.status === 'completed' ? '✓ Completed' : a.status === 'in_progress' ? 'Continue →' : 'Start course →'}
                  </div>
                </button>
              </div>
            ))}
          </>
        )}

        {/* HISTORY TAB */}
        {!loading && tab === 'history' && (
          <>
            {results.length === 0 && completed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <p style={{ color: 'var(--muted)', fontSize: 15 }}>No history yet.</p>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>Complete a course to see your results here.</p>
              </div>
            ) : (
              <>
                {/* Quiz results */}
                {results.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      Quiz Results
                    </div>
                    {results.map(r => (
                      <div key={r.id} style={{ marginBottom: 10 }}>
                        <div className="card" style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              background: r.passed ? 'var(--success-bg)' : 'var(--danger-bg)',
                            }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: r.passed ? 'var(--success-text)' : 'var(--danger-text)' }}>{r.score}%</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 2 }}>
                                {r.content?.title_en || 'Quiz'}
                              </p>
                              <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                                {new Date(r.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <span className={r.passed ? 'badge badge-completed' : 'badge badge-overdue'}>
                              {r.passed ? 'Passed' : 'Failed'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Completed courses */}
                {completed.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '16px 0 10px' }}>
                      Completed Courses
                    </div>
                    {completed.map(a => (
                      <div key={a.id} style={{ marginBottom: 10 }}>
                        <div style={{ background: 'var(--plum)', borderRadius: 14, padding: '14px 16px', border: '1.5px solid var(--gold-btn)', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ fontSize: 28, flexShrink: 0 }}>🏆</div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{a.course?.title_en}</p>
                            {a.completed_at && (
                              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                                Completed {new Date(a.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                          <span className="badge badge-completed">Done</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
