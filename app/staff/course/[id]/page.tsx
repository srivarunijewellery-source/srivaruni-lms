'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CoursePage() {
  const router = useRouter()
  const { id: courseId } = useParams() as { id: string }
  const assignmentId = useSearchParams().get('assignment') || ''

  const [staff, setStaff]     = useState<any>(null)
  const [course, setCourse]   = useState<any>(null)
  const [items, setItems]     = useState<any[]>([])
  const [progress, setProgress] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = localStorage.getItem('sv_staff')
    if (!s) { router.replace('/staff'); return }
    setStaff(JSON.parse(s))
  }, [])

  useEffect(() => { if (staff) load() }, [staff])

  async function load() {
    const [{ data: c }, { data: ci }, { data: prog }] = await Promise.all([
      supabase.from('lms_courses').select('*').eq('id', courseId).single(),
      supabase.from('lms_course_items')
        .select('order_index, content:lms_content(id,title_en,type,category,has_quiz,photo_url,body_en,status)')
        .eq('course_id', courseId).order('order_index'),
      supabase.from('lms_progress')
        .select('content_id,status')
        .eq('assignment_id', assignmentId)
        .eq('staff_id', staff.id),
    ])
    setCourse(c)
    setItems((ci || []).map((i: any) => i.content).filter(Boolean))
    setProgress(prog || [])
    setLoading(false)
  }

  function progFor(id: string) { return progress.find(p => p.content_id === id) }

  const completedCount = items.filter(i => progFor(i.id)?.status === 'completed').length
  const pct = items.length ? Math.round((completedCount / items.length) * 100) : 0
  const allDone = items.length > 0 && completedCount === items.length

  async function markAssignmentComplete() {
    await supabase.from('lms_assignments')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', assignmentId)
    router.push('/staff/dashboard')
  }

  const icon = (t: string) => ({ jewellery_piece: '💎', video: '🎥', document: '📋', text: '📝' }[t] || '📄')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)', paddingBottom: 40 }}>
      {/* Nav */}
      <div className="nav-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/staff/dashboard')}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '7px 12px', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
            ← Dashboard
          </button>
          <span className="nav-title" style={{ fontSize: 15 }}>{course?.title_en || 'Course'}</span>
        </div>
      </div>

      {/* Progress */}
      {course && (
        <div style={{ background: 'var(--plum)', padding: '0 20px 20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 8 }}>
            {completedCount} of {items.length} lessons complete
          </p>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Pass mark: {course.pass_threshold}%</span>
            <span style={{ fontSize: 12, color: 'var(--gold-btn)', fontWeight: 600 }}>{pct}% complete</span>
          </div>
        </div>
      )}

      <div style={{ padding: '16px 16px 0' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>Loading...</p>
        ) : (
          <>
            {items.map((item, idx) => {
              const p = progFor(item.id)
              const isDone   = p?.status === 'completed'
              const isLocked = idx > 0 && progFor(items[idx - 1].id)?.status !== 'completed'

              return (
                <div key={item.id} style={{ marginBottom: 10 }}>
                  <button
                    className={`lesson-card${isDone ? ' completed' : ''}`}
                    disabled={isLocked}
                    style={{ opacity: isLocked ? 0.5 : 1 }}
                    onClick={() => !isLocked && router.push(
                      `/staff/lesson/${item.id}?assignment=${assignmentId}&course=${courseId}`
                    )}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: isDone ? 18 : 14,
                        background: isDone ? 'var(--success-bg)' : isLocked ? 'var(--rose-bg)' : 'rgba(30,10,46,0.08)',
                        color: isDone ? 'var(--success-text)' : isLocked ? 'var(--muted)' : 'var(--plum)',
                      }}>
                        {isDone ? '✓' : isLocked ? '🔒' : idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                          <span>{icon(item.type)}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)' }}>{item.category}</span>
                          {item.has_quiz && <span className="badge badge-pending" style={{ fontSize: 11, padding: '2px 8px' }}>Quiz</span>}
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)', lineHeight: 1.3 }}>{item.title_en}</p>
                      </div>
                      {!isLocked && <span style={{ fontSize: 20, color: isDone ? 'var(--success-text)' : 'var(--muted)', flexShrink: 0 }}>{isDone ? '✅' : '›'}</span>}
                    </div>
                  </button>
                </div>
              )
            })}

            {/* All done banner */}
            {allDone && (
              <div style={{ background: 'var(--plum)', borderRadius: 14, padding: 24, textAlign: 'center', border: '1.5px solid var(--gold-btn)', marginTop: 8 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🎊</div>
                <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>All lessons complete!</h3>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 20 }}>
                  Tap below to finish the course and get your certificate.
                </p>
                <button className="btn-gold" onClick={markAssignmentComplete}>
                  Finish &amp; get certificate 🏆
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
