'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function ScorePill({ score, isBest, isLatest }: { score: number; isBest?: boolean; isLatest?: boolean }) {
  const passed = score >= 80
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        fontSize: 13, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
        background: passed ? '#E8F5EE' : '#FDECEA',
        color: passed ? '#1A6B3C' : '#9B1C1C'
      }}>{score}%</span>
      {isBest && <span style={{ fontSize: 10, fontWeight: 700, color: '#6B21A8', background: '#F3E8FF', padding: '1px 6px', borderRadius: 10 }}>BEST</span>}
      {isLatest && !isBest && <span style={{ fontSize: 10, fontWeight: 700, color: '#1A4A8A', background: '#EAF1FB', padding: '1px 6px', borderRadius: 10 }}>LATEST</span>}
    </div>
  )
}

export default function ManagerStaff() {
  const router = useRouter()
  const [staff, setStaff] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [detail, setDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [filterCourse, setFilterCourse] = useState('all')
  const [courses, setCourses] = useState<any[]>([])
  const [mgr, setMgr] = useState<any>(null)

  useEffect(() => {
    const m = localStorage.getItem('sv_manager')
    if (!m) { router.replace('/manager/login'); return }
    const parsed = JSON.parse(m)
    setMgr(parsed)
  }, [])

  useEffect(() => { if (mgr) load() }, [mgr])

  async function load() {
    const branch = mgr?.selectedBranch || 'Boduppal'
    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from('staff').select('id, name, role, branch').eq('active', true).eq('branch', branch).order('name'),
      supabase.from('lms_courses').select('id, title_en').eq('status', 'published').order('created_at'),
    ])
    setCourses(c || [])

    const withStats = await Promise.all((s || []).map(async (st: any) => {
      const { data: assignments } = await supabase
        .from('lms_assignments')
        .select('status, course:lms_courses(id, title_en)')
        .eq('staff_id', st.id)

      // Best + latest scores per course
      const { data: quizResults } = await supabase
        .from('lms_module_quiz_results')
        .select('score, passed, is_best_score, completed_at, course_id')
        .eq('staff_id', st.id)
        .order('completed_at', { ascending: false })

      const courseMap: Record<string, any> = {}
      for (const a of (assignments || [])) {
        const cid = (a.course as any)?.id
        if (!cid) continue
        if (!courseMap[cid]) courseMap[cid] = { title: (a.course as any)?.title_en, status: a.status, best: null, latest: null }
        else courseMap[cid].status = a.status
      }
      for (const q of (quizResults || [])) {
        if (!courseMap[q.course_id]) continue
        if (q.is_best_score) courseMap[q.course_id].best = q.score
        if (!courseMap[q.course_id].latest) courseMap[q.course_id].latest = { score: q.score, date: q.completed_at }
      }

      const totalCourses = Object.keys(courseMap).length
      const completedCourses = Object.values(courseMap).filter((c: any) => c.status === 'completed').length

      return { ...st, courseMap, totalCourses, completedCourses }
    }))

    setStaff(withStats)
    setLoading(false)
  }

  async function loadDetail(s: any) {
    setSelected(s)
    setDetailLoading(true)

    const { data: allResults } = await supabase
      .from('lms_module_quiz_results')
      .select('score, passed, is_best_score, attempt_number, completed_at, course:lms_courses(title_en)')
      .eq('staff_id', s.id)
      .order('completed_at', { ascending: false })

    setDetail({ allResults })
    setDetailLoading(false)
  }

  const statusIcon = (s: string) => ({ completed: '✅', in_progress: '🔄', pending: '⏳', overdue: '⚠️' }[s] || '⏳')
  const statusLabel = (s: string) => ({ completed: 'Completed', in_progress: 'In Progress', pending: 'Pending', overdue: 'Overdue' }[s] || 'Pending')
  const statusColor = (s: string) => ({ completed: '#1A6B3C', in_progress: '#1A4A8A', pending: '#7A4D00', overdue: '#9B1C1C' }[s] || '#7A4D00')
  const statusBg = (s: string) => ({ completed: '#E8F5EE', in_progress: '#EAF1FB', pending: '#FEF3DC', overdue: '#FDECEA' }[s] || '#FEF3DC')

  const filtered = filterCourse === 'all' ? staff : staff.filter(s => s.courseMap[filterCourse])

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E0A2E', margin: 0 }}>My Team</h1>
        <p style={{ color: '#5A5A5A', fontSize: 14, marginTop: 4 }}>
          {mgr?.selectedBranch || 'Boduppal'} branch · Individual staff progress and scores
        </p>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setFilterCourse('all')}
          style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', border: '1.5px solid', transition: 'all 0.15s', borderColor: filterCourse === 'all' ? '#1E0A2E' : '#D4CEC8', background: filterCourse === 'all' ? '#1E0A2E' : '#fff', color: filterCourse === 'all' ? '#fff' : '#5A5A5A' }}>
          All Courses
        </button>
        {courses.map(c => (
          <button key={c.id} onClick={() => setFilterCourse(c.id)}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', border: '1.5px solid', transition: 'all 0.15s', borderColor: filterCourse === c.id ? '#1E0A2E' : '#D4CEC8', background: filterCourse === c.id ? '#1E0A2E' : '#fff', color: filterCourse === c.id ? '#fff' : '#5A5A5A' }}>
            {c.title_en}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr' : '1fr', gap: 10 }}>
        {loading ? <p style={{ color: '#5A5A5A' }}>Loading...</p> : filtered.map(s => (
          <div key={s.id} style={{ background: '#fff', border: `1.5px solid ${selected?.id === s.id ? '#C9933A' : '#E2D8E8'}`, borderRadius: 14, padding: '16px', cursor: 'pointer', transition: 'all 0.15s' }}
            onClick={() => selected?.id === s.id ? (setSelected(null), setDetail(null)) : loadDetail(s)}>

            {/* Staff header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1E0A2E', color: '#C9933A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {s.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1E0A2E' }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: '#5A5A5A' }}>{s.role}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.completedCourses === s.totalCourses && s.totalCourses > 0 ? '#1A6B3C' : '#1E0A2E' }}>
                  {s.completedCourses}/{s.totalCourses}
                </div>
                <div style={{ fontSize: 11, color: '#5A5A5A' }}>courses done</div>
              </div>
            </div>

            {/* Course status rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(s.courseMap).map(([cid, cd]: [string, any]) => (
                <div key={cid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#FAF8F4' }}>
                  <span style={{ fontSize: 14 }}>{statusIcon(cd.status)}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2C', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cd.title}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: statusBg(cd.status), color: statusColor(cd.status), flexShrink: 0 }}>
                    {statusLabel(cd.status)}
                  </span>
                  {/* Show scores if available */}
                  {cd.best !== null && (
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <ScorePill score={cd.best} isBest={true} />
                      {cd.latest && cd.latest.score !== cd.best && (
                        <ScorePill score={cd.latest.score} isLatest={true} />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Expanded detail */}
            {selected?.id === s.id && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #E2D8E8' }}>
                {detailLoading ? (
                  <p style={{ color: '#5A5A5A', fontSize: 14 }}>Loading history...</p>
                ) : detail?.allResults?.length === 0 ? (
                  <p style={{ color: '#5A5A5A', fontSize: 14 }}>No quiz attempts yet.</p>
                ) : (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                      Full Quiz History
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {detail.allResults.map((r: any, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: r.is_best_score ? '#F3E8FF' : '#FAF8F4', border: `1px solid ${r.is_best_score ? '#E9D5FF' : '#E2D8E8'}` }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1E0A2E', marginBottom: 2 }}>
                              {(r.course as any)?.title_en}
                            </div>
                            <div style={{ fontSize: 11, color: '#5A5A5A' }}>
                              Attempt {r.attempt_number} · {new Date(r.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {r.is_best_score && <span style={{ marginLeft: 6, color: '#6B21A8', fontWeight: 700 }}>★ Best</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: r.passed ? '#1A6B3C' : '#9B1C1C' }}>{r.score}%</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: r.passed ? '#1A6B3C' : '#9B1C1C' }}>{r.passed ? 'Passed' : 'Failed'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div style={{ marginTop: 10, fontSize: 12, color: '#C9933A', fontWeight: 600 }}>
              {selected?.id === s.id ? '▲ Hide history' : '▼ View full history'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
