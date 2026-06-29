'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CoursePage() {
  const router = useRouter()
  const { id: courseId } = useParams() as { id: string }
  const assignmentId = useSearchParams().get('assignment') || ''

  const [staff,      setStaff]      = useState<any>(null)
  const [course,     setCourse]     = useState<any>(null)
  const [items,      setItems]      = useState<any[]>([])
  const [progress,   setProgress]   = useState<any[]>([])
  const [quizResult, setQuizResult] = useState<any>(null)
  const [loading,    setLoading]    = useState(true)
  const [lang,       setLang]       = useState<'en'|'te'>('en')

  useEffect(() => {
    const s = localStorage.getItem('sv_staff')
    if (!s) { router.replace('/staff'); return }
    setStaff(JSON.parse(s))
    const l = localStorage.getItem('sv_lang') as 'en'|'te'
    if (l) setLang(l)
  }, [])

  useEffect(() => { if (staff) load() }, [staff])

  async function load() {
    const [{ data: c }, { data: ci }, { data: prog }, { data: mqr }] = await Promise.all([
      supabase.from('lms_courses').select('*').eq('id', courseId).single(),
      supabase.from('lms_course_items')
        .select('order_index, content_id, content:lms_content(id,title_en,title_te,type,category,has_quiz,photo_url,status)')
        .eq('course_id', courseId).order('order_index'),
      supabase.from('lms_progress')
        .select('content_id,status')
        .eq('assignment_id', assignmentId)
        .eq('staff_id', staff.id),
      supabase.from('lms_module_quiz_results')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('completed_at', { ascending: false })
        .limit(1),
    ])
    setCourse(c)
    setItems((ci || []).map((i: any) => i.content).filter(Boolean))
    setProgress(prog || [])
    setQuizResult(mqr?.[0] || null)
    setLoading(false)
  }

  function progFor(id: string) { return progress.find(p => p.content_id === id) }
  const completedCount = items.filter(i => progFor(i.id)?.status === 'completed').length
  const allLessonsDone = items.length > 0 && completedCount === items.length
  const pct = items.length ? Math.round((completedCount / items.length) * 100) : 0
  const quizPassed = quizResult?.passed === true

  // Can retake quiz? Must have reviewed at least one lesson after failing
  const canRetakeQuiz = allLessonsDone && !quizPassed && (() => {
    if (!quizResult) return true
    const lastAttempt = new Date(quizResult.completed_at)
    // Check if any lesson was accessed after last quiz attempt
    return progress.some(p => p.status === 'completed')
  })()

  const icon = (t: string) => ({ jewellery_piece: '💎', video: '🎥', document: '📋', text: '📝' }[t] || '📄')

  function toggleLang() {
    const nl = lang === 'en' ? 'te' : 'en'
    setLang(nl); localStorage.setItem('sv_lang', nl)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)', paddingBottom: 40 }}>
      {/* Sticky nav */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--plum)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => router.push('/staff/dashboard')}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
              ← Home
            </button>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
              {lang === 'te' ? course?.title_te : course?.title_en}
            </span>
          </div>
          <button onClick={toggleLang}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid var(--gold-btn)', borderRadius: 20, padding: '5px 12px', color: 'var(--gold-btn)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
            {lang === 'en' ? 'తెలుగు' : 'English'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {course && (
        <div style={{ background: 'var(--plum)', padding: '0 20px 20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 8 }}>
            {completedCount} of {items.length} lessons read
            {quizPassed ? ' · Quiz passed ✓' : ''}
          </p>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              {lang === 'te' ? `పాస్ మార్క్: ${course.pass_threshold}%` : `Pass mark: ${course.pass_threshold}%`}
            </span>
            <span style={{ fontSize: 12, color: 'var(--gold-btn)', fontWeight: 600 }}>{pct}%</span>
          </div>
        </div>
      )}

      <div style={{ padding: '16px 16px 0' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>Loading...</p>
        ) : (
          <>
            {/* Section header */}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              {lang === 'te' ? 'పాఠాలు' : 'Lessons'}
            </div>

            {/* Lesson items */}
            {items.map((item, idx) => {
              const p = progFor(item.id)
              const isDone = p?.status === 'completed'
              return (
                <div key={item.id} style={{ marginBottom: 10 }}>
                  <button className={`lesson-card${isDone ? ' completed' : ''}`}
                    onClick={() => router.push(`/staff/lesson/${item.id}?assignment=${assignmentId}&course=${courseId}`)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: isDone ? 18 : 14,
                        background: isDone ? 'var(--success-bg)' : 'rgba(30,10,46,0.08)',
                        color: isDone ? 'var(--success-text)' : 'var(--plum)',
                      }}>
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                          <span>{icon(item.type)}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)' }}>
                            {item.category}
                          </span>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)', lineHeight: 1.3,
                          fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
                          {lang === 'te' ? item.title_te : item.title_en}
                        </p>
                      </div>
                      <span style={{ fontSize: 14, color: isDone ? 'var(--success-text)' : 'var(--muted)', flexShrink: 0 }}>
                        {isDone ? '✅ Done' : '›'}
                      </span>
                    </div>
                  </button>
                </div>
              )
            })}

            {/* Divider */}
            {items.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 12px' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {lang === 'te' ? 'మాడ్యూల్ క్విజ్' : 'Module Quiz'}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
            )}

            {/* Module quiz card */}
            {!quizPassed && !allLessonsDone && (
              <div style={{ background: 'var(--white)', border: '1.5px dashed var(--border-dark)', borderRadius: 14, padding: '16px', opacity: 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--rose-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🔒</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)',
                      fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
                      {lang === 'te' ? 'మాడ్యూల్ క్విజ్ — లాక్ చేయబడింది' : 'Module Quiz — Locked'}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2,
                      fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
                      {lang === 'te'
                        ? `అన్ని ${items.length} పాఠాలు పూర్తి చేసిన తర్వాత అన్‌లాక్ అవుతుంది`
                        : `Unlocks after all ${items.length} lessons are read`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quiz available */}
            {allLessonsDone && !quizPassed && (
              <div style={{ background: 'var(--white)', border: '1.5px solid var(--gold-btn)', borderRadius: 14, padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📝</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--charcoal)',
                      fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
                      {lang === 'te' ? 'మాడ్యూల్ క్విజ్' : 'Module Quiz'}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2,
                      fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
                      {lang === 'te' ? '10 ప్రశ్నలు · 80% పాస్ కావాలి' : '10 questions · 80% to pass'}
                    </p>
                  </div>
                </div>

                {/* Previous attempt */}
                {quizResult && (
                  <div style={{ background: 'var(--danger-bg)', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
                    <p style={{ fontSize: 13, color: 'var(--danger-text)', fontWeight: 500 }}>
                      {lang === 'te'
                        ? `మీ చివరి స్కోర్: ${quizResult.score}% — పాస్ కాలేదు. పాఠాలు మళ్ళీ చదివి ప్రయత్నించండి.`
                        : `Last attempt: ${quizResult.score}% — not passed. Review lessons above and try again.`}
                    </p>
                  </div>
                )}

                <button className="btn-gold"
                  onClick={() => router.push(`/staff/module-quiz/${courseId}?assignment=${assignmentId}`)}>
                  {lang === 'te'
                    ? (quizResult ? 'మళ్ళీ ప్రయత్నించు →' : 'క్విజ్ ప్రారంభించు →')
                    : (quizResult ? 'Retake quiz →' : 'Start quiz →')}
                </button>
              </div>
            )}

            {/* Quiz passed */}
            {quizPassed && (
              <div style={{ background: 'var(--plum)', border: '1.5px solid var(--gold-btn)', borderRadius: 14, padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🏆</div>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4,
                  fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
                  {lang === 'te' ? 'కోర్సు పూర్తయింది!' : 'Course Complete!'}
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 16,
                  fontFamily: lang === 'te' ? 'Noto Sans Telugu,sans-serif' : 'DM Sans,sans-serif' }}>
                  {lang === 'te' ? `స్కోర్: ${quizResult?.score}%` : `Score: ${quizResult?.score}%`}
                </p>
                <button className="btn-gold"
                  onClick={() => router.push(`/staff/certificate/${courseId}?assignment=${assignmentId}`)}>
                  {lang === 'te' ? 'సర్టిఫికెట్ తీసుకో 🏆' : 'Get Certificate 🏆'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;600;700&display=swap');`}</style>
    </div>
  )
}
