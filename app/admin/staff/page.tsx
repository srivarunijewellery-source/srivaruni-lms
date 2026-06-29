'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminStaff() {
  const [staff, setStaff] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [detail, setDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: s } = await supabase.from('staff').select('id, name, role, active').eq('active', true).order('name')
    // For each staff, get assignment counts
    const staffWithStats = await Promise.all((s || []).map(async (st: any) => {
      const [{ count: total }, { count: completed }, { data: latestQuiz }] = await Promise.all([
        supabase.from('lms_assignments').select('*', { count: 'exact', head: true }).eq('staff_id', st.id),
        supabase.from('lms_assignments').select('*', { count: 'exact', head: true }).eq('staff_id', st.id).eq('status', 'completed'),
        supabase.from('lms_module_quiz_results').select('score, passed').eq('staff_id', st.id).order('completed_at', { ascending: false }).limit(1),
      ])
      return { ...st, total: total || 0, completed: completed || 0, latestScore: latestQuiz?.[0]?.score ?? null, latestPassed: latestQuiz?.[0]?.passed ?? null }
    }))
    setStaff(staffWithStats)
    setLoading(false)
  }

  async function loadDetail(staffMember: any) {
    setSelected(staffMember)
    setDetailLoading(true)
    const [{ data: assignments }, { data: quizResults }, { data: certs }] = await Promise.all([
      supabase.from('lms_assignments')
        .select('id, status, due_date, assigned_at, completed_at, course:lms_courses(title_en)')
        .eq('staff_id', staffMember.id)
        .order('assigned_at', { ascending: false }),
      supabase.from('lms_module_quiz_results')
        .select('score, passed, attempt_number, completed_at, course:lms_courses(title_en)')
        .eq('staff_id', staffMember.id)
        .order('completed_at', { ascending: false }),
      supabase.from('lms_certificates')
        .select('final_score, issued_at, course:lms_courses(title_en)')
        .eq('staff_id', staffMember.id)
        .order('issued_at', { ascending: false }),
    ])
    setDetail({ assignments, quizResults, certs })
    setDetailLoading(false)
  }

  const statusBadge = (s: string) => {
    const map: Record<string, [string, string, string]> = {
      pending:     ['Pending',     '#FEF3DC', '#7A4D00'],
      in_progress: ['In Progress', '#EAF1FB', '#1A4A8A'],
      completed:   ['Completed',   '#E8F5EE', '#1A6B3C'],
      overdue:     ['Overdue',     '#FDECEA', '#9B1C1C'],
    }
    const [label, bg, color] = map[s] || map.pending
    return <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: bg, color }}>{label}</span>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.5fr' : '1fr', gap: 24 }}>
      {/* Staff list */}
      <div>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1E0A2E', margin: 0 }}>Staff Progress</h1>
          <p style={{ color: '#5A5A5A', fontSize: 14, marginTop: 4 }}>Click a staff member to see full history</p>
        </div>

        {loading ? <p style={{ color: '#5A5A5A' }}>Loading...</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {staff.map(s => (
              <button key={s.id} onClick={() => loadDetail(s)}
                style={{ background: selected?.id === s.id ? '#1E0A2E' : '#fff', border: `1.5px solid ${selected?.id === s.id ? '#1E0A2E' : '#E2D8E8'}`, borderRadius: 12, padding: '14px 16px', textAlign: 'left', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: selected?.id === s.id ? '#fff' : '#1E0A2E', marginBottom: 2 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: selected?.id === s.id ? 'rgba(255,255,255,0.6)' : '#5A5A5A' }}>{s.role}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: selected?.id === s.id ? '#C9933A' : '#1E0A2E' }}>{s.completed}/{s.total}</div>
                    <div style={{ fontSize: 11, color: selected?.id === s.id ? 'rgba(255,255,255,0.5)' : '#5A5A5A' }}>completed</div>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ marginTop: 10, height: 4, borderRadius: 999, background: selected?.id === s.id ? 'rgba(255,255,255,0.15)' : '#F0EBF8', overflow: 'hidden' }}>
                  <div style={{ height: 4, borderRadius: 999, background: '#C9933A', width: s.total > 0 ? `${(s.completed / s.total) * 100}%` : '0%', transition: 'width 0.4s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: selected?.id === s.id ? 'rgba(255,255,255,0.5)' : '#5A5A5A' }}>
                    {s.total > 0 ? `${Math.round((s.completed / s.total) * 100)}% complete` : 'No courses assigned'}
                  </span>
                  {s.latestScore !== null && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: s.latestPassed ? '#1A6B3C' : '#9B1C1C' }}>
                      Last quiz: {s.latestScore}%
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Staff detail */}
      {selected && (
        <div>
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1E0A2E', margin: 0 }}>{selected.name}</h2>
              <p style={{ color: '#5A5A5A', fontSize: 14, marginTop: 2 }}>{selected.role}</p>
            </div>
            <button onClick={() => { setSelected(null); setDetail(null) }}
              style={{ fontSize: 13, color: '#5A5A5A', background: 'none', border: '1.5px solid #D4CEC8', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              ✕ Close
            </button>
          </div>

          {detailLoading ? <p style={{ color: '#5A5A5A' }}>Loading...</p> : detail && (
            <>
              {/* Assignments */}
              <div style={{ background: '#fff', border: '1.5px solid #E2D8E8', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2D8E8' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E0A2E', margin: 0 }}>Course Assignments</h3>
                </div>
                {detail.assignments?.length === 0 ? (
                  <p style={{ padding: '16px 20px', color: '#5A5A5A', fontSize: 14 }}>No assignments.</p>
                ) : detail.assignments?.map((a: any, i: number) => (
                  <div key={i} style={{ padding: '12px 20px', borderTop: i > 0 ? '1px solid #E2D8E8' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1E0A2E' }}>{a.course?.title_en}</div>
                      {a.due_date && <div style={{ fontSize: 12, color: '#5A5A5A', marginTop: 2 }}>Due: {new Date(a.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>}
                    </div>
                    {statusBadge(a.status)}
                  </div>
                ))}
              </div>

              {/* Quiz Results */}
              <div style={{ background: '#fff', border: '1.5px solid #E2D8E8', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2D8E8' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E0A2E', margin: 0 }}>Quiz Results</h3>
                </div>
                {detail.quizResults?.length === 0 ? (
                  <p style={{ padding: '16px 20px', color: '#5A5A5A', fontSize: 14 }}>No quiz attempts yet.</p>
                ) : detail.quizResults?.map((r: any, i: number) => (
                  <div key={i} style={{ padding: '12px 20px', borderTop: i > 0 ? '1px solid #E2D8E8' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1E0A2E' }}>{r.course?.title_en}</div>
                      <div style={{ fontSize: 12, color: '#5A5A5A', marginTop: 2 }}>
                        Attempt {r.attempt_number} · {new Date(r.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: r.passed ? '#1A6B3C' : '#9B1C1C' }}>{r.score}%</div>
                      <div style={{ fontSize: 11, color: r.passed ? '#1A6B3C' : '#9B1C1C', fontWeight: 600 }}>{r.passed ? 'Passed' : 'Failed'}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Certificates */}
              {detail.certs?.length > 0 && (
                <div style={{ background: '#1E0A2E', border: '1.5px solid #C9933A', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#C9933A', margin: 0 }}>🏆 Certificates</h3>
                  </div>
                  {detail.certs.map((c: any, i: number) => (
                    <div key={i} style={{ padding: '12px 20px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{c.course?.title_en}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                          {new Date(c.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      {c.final_score && <div style={{ fontSize: 16, fontWeight: 700, color: '#C9933A' }}>{c.final_score}%</div>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
