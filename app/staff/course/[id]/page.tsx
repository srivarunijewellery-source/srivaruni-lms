'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase, type Content, type Progress } from '@/lib/supabase'

export default function CoursePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const courseId = params.id as string
  const assignmentId = searchParams.get('assignment') || ''

  const [staff, setStaff] = useState<any>(null)
  const [course, setCourse] = useState<any>(null)
  const [items, setItems] = useState<Content[]>([])
  const [progress, setProgress] = useState<Progress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = localStorage.getItem('sv_staff')
    if (!s) { router.push('/staff'); return }
    setStaff(JSON.parse(s))
  }, [])

  useEffect(() => {
    if (!staff) return
    fetchCourse()
  }, [staff])

  async function fetchCourse() {
    const { data: c } = await supabase.from('lms_courses').select('*').eq('id', courseId).single()
    setCourse(c)
    const { data: ci } = await supabase
      .from('lms_course_items')
      .select('*, content:lms_content(*)')
      .eq('course_id', courseId)
      .order('order_index')
    setItems((ci || []).map((i: any) => i.content).filter(Boolean))
    const { data: prog } = await supabase
      .from('lms_progress')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('staff_id', staff.id)
    setProgress(prog || [])
    setLoading(false)
  }

  function getProgress(contentId: string) {
    return progress.find(p => p.content_id === contentId)
  }

  function getIcon(type: string) {
    return { jewellery_piece: '💎', video: '🎥', document: '📋', text: '📝' }[type] || '📄'
  }

  const completedCount = items.filter(i => getProgress(i.id)?.status === 'completed').length
  const totalPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)', paddingBottom: 40 }}>
      <div className="nav-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '7px 12px', color: '#FFFFFF', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            ← Back
          </button>
          <span className="nav-title" style={{ fontSize: 15 }}>{course?.title_en || 'Course'}</span>
        </div>
      </div>

      {course && (
        <div style={{ background: 'var(--plum)', padding: '0 20px 20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 10 }}>
            {completedCount} of {items.length} lessons complete
          </p>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${totalPercent}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Pass mark: {course.pass_threshold}%</span>
            <span style={{ fontSize: 12, color: 'var(--gold-btn)', fontWeight: 600 }}>{totalPercent}%</span>
          </div>
        </div>
      )}

      <div style={{ padding: '16px 16px 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)', fontSize: 14 }}>Loading...</div>
        ) : items.map((item, idx) => {
          const prog = getProgress(item.id)
          const isCompleted = prog?.status === 'completed'
          const isLocked = idx > 0 && getProgress(items[idx - 1].id)?.status !== 'completed'

          return (
            <div key={item.id} style={{ marginBottom: 10 }}>
              <button
                className={`lesson-card ${isCompleted ? 'completed' : ''}`}
                onClick={() => { if (!isLocked) router.push(`/staff/lesson/${item.id}?assignment=${assignmentId}&course=${courseId}`) }}
                disabled={isLocked}
                style={{ opacity: isLocked ? 0.55 : 1 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: isCompleted ? 18 : 14, flexShrink: 0,
                    background: isCompleted ? 'var(--success-bg)' : isLocked ? 'var(--rose-bg)' : 'rgba(30,10,46,0.08)',
                    color: isCompleted ? 'var(--success-text)' : isLocked ? 'var(--muted)' : 'var(--plum)',
                  }}>
                    {isCompleted ? '✓' : isLocked ? '🔒' : idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span>{getIcon(item.type)}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)' }}>{item.category}</span>
                      {item.has_quiz && <span className="badge badge-pending" style={{ fontSize: 11, padding: '2px 8px' }}>Quiz</span>}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)', lineHeight: 1.3 }}>{item.title_en}</p>
                  </div>
                  {!isLocked && (
                    <span style={{ color: isCompleted ? 'var(--success-text)' : 'var(--muted)', fontSize: 20, flexShrink: 0 }}>
                      {isCompleted ? '✅' : '›'}
                    </span>
                  )}
                </div>
              </button>
            </div>
          )
        })}

        {!loading && items.length > 0 && completedCount === items.length && (
          <div style={{ background: 'var(--plum)', borderRadius: 14, padding: '24px', textAlign: 'center', border: '1.5px solid var(--gold-btn)', marginTop: 8 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🎊</div>
            <h3 style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Congratulations!</h3>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 20 }}>You have completed all lessons in this course.</p>
            <button className="btn-gold" onClick={() => router.push(`/staff/certificate/${courseId}?assignment=${assignmentId}`)}>
              Get your certificate 🏆
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
