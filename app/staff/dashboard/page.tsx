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
  const [quizHistory, setQuizHistory] = useState<any[]>([])
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
    const [{ data: asgn }, { data: quiz }] = await Promise.all([
      supabase
        .from('lms_assignments')
        .select('id, course_id, status, due_date, assigned_at, completed_at, course:lms_courses(title_en, description_en, pass_threshold)')
        .eq('staff_id', staff.id)
        .order('assigned_at', { ascending: false }),
      supabase
        .from('lms_module_quiz_results')
        .select('score, passed, is_best_score, attempt_number, completed_at, course:lms_courses(title_en)')
        .eq('staff_id', staff.id)
        .order('completed_at', { ascending: false }),
    ])
    setAssignments(asgn || [])
    setQuizHistory(quiz || [])
    setLoading(false)
  }

  const pending   = assignments.filter(a => a.status !== 'completed')
  const completed = assignments.filter(a => a.status === 'completed')

  // Group quiz history by course — best and latest per course
  const courseScores: Record<string, { title: string; best: any; latest: any; attempts: number }> = {}
  for (const q of quizHistory) {
    const title = (q.course as any)?.title_en || 'Unknown'
    const cid = title // group by title since we don't have course_id here
    if (!courseScores[cid]) courseScores[cid] = { title, best: null, latest: null, attempts: 0 }
    courseScores[cid].attempts++
    if (q.is_best_score) courseScores[cid].best = q
    if (!courseScores[cid].latest) courseScores[cid].latest = q
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)', paddingBottom: 40 }}>
      {/* Nav */}
      <div className="nav-bar">
        <div>
          <span className="nav-brand">Sri Varuni Jewellery</span>
          <span className="nav-title">{staff ? `Hello, ${staff.name.split(' ')[0]}` : 'My Training'}</span>
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
            { num: Object.keys(courseScores).length, label: 'Quizzes taken' },
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
          My Scores
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

        {/* SCORES / HISTORY TAB */}
        {!loading && tab === 'history' && (
          <>
            {Object.keys(courseScores).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <p style={{ color: 'var(--muted)', fontSize: 15 }}>No quiz scores yet.</p>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>Complete a course quiz to see your scores here.</p>
              </div>
            ) : Object.values(courseScores).map((cs: any, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                  {/* Course title bar */}
                  <div style={{ padding: '12px 16px', background: 'var(--plum)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>{cs.title}</h3>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{cs.attempts} attempt{cs.attempts > 1 ? 's' : ''}</span>
                  </div>

                  {/* Best score */}
                  {cs.best && (
                    <div style={{ padding: '12px 16px', borderBottom: cs.latest && cs.latest.score !== cs.best?.score ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F3E8FF' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#6B21A8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>★ Best Score</div>
                        <div style={{ fontSize: 12, color: '#5A5A5A' }}>
                          {new Date(cs.best.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}Attempt {cs.best.attempt_number}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: cs.best.passed ? 'var(--success-text)' : 'var(--danger-text)' }}>{cs.best.score}%</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: cs.best.passed ? 'var(--success-text)' : 'var(--danger-text)' }}>{cs.best.passed ? 'Passed ✓' : 'Failed'}</div>
                      </div>
                    </div>
                  )}

                  {/* Latest score — only show if different from best */}
                  {cs.latest && cs.best && cs.latest.score !== cs.best.score && (
                    <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Latest Score</div>
                        <div style={{ fontSize: 12, color: '#5A5A5A' }}>
                          {new Date(cs.latest.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}Attempt {cs.latest.attempt_number}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: cs.latest.passed ? 'var(--success-text)' : 'var(--danger-text)' }}>{cs.latest.score}%</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: cs.latest.passed ? 'var(--success-text)' : 'var(--danger-text)' }}>{cs.latest.passed ? 'Passed ✓' : 'Failed'}</div>
                      </div>
                    </div>
                  )}

                  {/* Completed badge if passed */}
                  {cs.best?.passed && (
                    <div style={{ padding: '10px 16px', background: 'var(--success-bg)', borderTop: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>🏅</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success-text)' }}>
                        Module completed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
