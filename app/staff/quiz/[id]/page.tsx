'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function QuizPage() {
  const router = useRouter()
  const { id: contentId } = useParams() as { id: string }
  const sp = useSearchParams()
  const assignmentId = sp.get('assignment') || ''
  const courseId     = sp.get('course') || ''

  const [staff, setStaff]     = useState<any>(null)
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState<{ qid: string; chosen: string; correct: boolean }[]>([])
  const [done, setDone]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [finalScore, setFinalScore] = useState(0)

  useEffect(() => {
    const s = localStorage.getItem('sv_staff')
    if (!s) { router.replace('/staff'); return }
    setStaff(JSON.parse(s))
  }, [])

  useEffect(() => {
    if (!staff) return
    supabase.from('lms_quizzes').select('*')
      .eq('content_id', contentId).order('order_index')
      .then(({ data }) => { setQuizzes(data || []); setLoading(false) })
  }, [staff])

  const q = quizzes[current]
  const options = q ? [
    { key: 'a', text: q.option_a_en },
    { key: 'b', text: q.option_b_en },
    ...(q.option_c_en ? [{ key: 'c', text: q.option_c_en }] : []),
    ...(q.option_d_en ? [{ key: 'd', text: q.option_d_en }] : []),
  ] : []

  function submitAnswer() {
    if (!selected || !q) return
    const correct = selected === q.correct_option
    setAnswers(prev => [...prev, { qid: q.id, chosen: selected, correct }])
    setSubmitted(true)
  }

  async function next() {
    const isLast = current + 1 >= quizzes.length
    if (!isLast) {
      setCurrent(c => c + 1); setSelected(null); setSubmitted(false)
      return
    }

    // Last question — save results
    setSaving(true)
    const all = [...answers]
    const score = Math.round((all.filter(a => a.correct).length / quizzes.length) * 100)
    setFinalScore(score)

    await supabase.from('lms_results').insert({
      assignment_id: assignmentId,
      staff_id: staff.id,
      content_id: contentId,
      score,
      passed: score >= 80,
      attempt_number: 1,
      answers_json: all,
      completed_at: new Date().toISOString(),
    })

    setSaving(false)
    setDone(true)
  }

  const passed = finalScore >= 80

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ivory)' }}>
      <p style={{ color: 'var(--muted)' }}>Loading quiz...</p>
    </div>
  )

  // Results screen
  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: passed ? 'var(--plum)' : 'var(--ivory)' }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>{passed ? '🏆' : '📚'}</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: passed ? '#fff' : 'var(--charcoal)', marginBottom: 8, textAlign: 'center' }}>
        {passed ? 'Well done!' : 'Not quite yet'}
      </h1>

      {/* Score circle */}
      <div style={{
        width: 110, height: 110, borderRadius: '50%', margin: '20px 0',
        border: `3px solid ${passed ? 'var(--gold-btn)' : 'var(--border-dark)'}`,
        background: passed ? 'rgba(255,255,255,0.1)' : 'var(--white)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 30, fontWeight: 700, color: passed ? 'var(--gold-btn)' : 'var(--plum)' }}>{finalScore}%</span>
        <span style={{ fontSize: 12, color: passed ? 'rgba(255,255,255,0.7)' : 'var(--muted)', marginTop: 2 }}>Your score</span>
      </div>

      <p style={{ textAlign: 'center', fontSize: 15, lineHeight: 1.6, marginBottom: 28, color: passed ? 'rgba(255,255,255,0.8)' : 'var(--muted)' }}>
        {passed
          ? 'You passed this lesson. Continue to the next one!'
          : `You need 80% to pass. You got ${finalScore}%. Review the lesson and try again.`}
      </p>

      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn-gold"
          onClick={() => router.push(`/staff/course/${courseId}?assignment=${assignmentId}`)}>
          {passed ? 'Continue course →' : 'Back to lessons →'}
        </button>
        {!passed && (
          <button
            onClick={() => router.push(`/staff/lesson/${contentId}?assignment=${assignmentId}&course=${courseId}`)}
            style={{ background: 'transparent', border: '1.5px solid var(--border-dark)', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 600, color: 'var(--body)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
            Review lesson again
          </button>
        )}
      </div>
    </div>
  )

  // Quiz screen
  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)', paddingBottom: 100 }}>
      {/* Nav */}
      <div className="nav-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push(`/staff/lesson/${contentId}?assignment=${assignmentId}&course=${courseId}`)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '7px 12px', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
            ← Lesson
          </button>
          <span className="nav-title">Quiz</span>
        </div>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
          {current + 1} / {quizzes.length}
        </span>
      </div>

      {/* Progress dots */}
      <div style={{ background: 'var(--plum)', padding: '0 20px 16px', display: 'flex', gap: 5 }}>
        {quizzes.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 999, transition: 'background 0.2s',
            background: i < current ? 'var(--gold-btn)' : i === current ? 'rgba(201,147,58,0.5)' : 'rgba(255,255,255,0.2)',
          }} />
        ))}
      </div>

      {q && (
        <div style={{ padding: '20px 16px 0' }}>
          {/* Question */}
          <div className="card" style={{ padding: '18px 20px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)', marginBottom: 8 }}>
              Question {current + 1}
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--charcoal)', lineHeight: 1.5 }}>
              {q.question_en}
            </p>
          </div>

          {/* Options */}
          <div>
            {options.map(opt => {
              const isSel     = selected === opt.key
              const isCorrect = submitted && opt.key === q.correct_option
              const isWrong   = submitted && isSel && !isCorrect
              return (
                <button key={opt.key}
                  className={`answer-option${isCorrect ? ' correct' : isWrong ? ' wrong' : isSel ? ' selected' : ''}`}
                  onClick={() => !submitted && setSelected(opt.key)}
                  disabled={submitted}>
                  <div className="option-key" style={{
                    background: isCorrect ? '#16A34A' : isWrong ? '#DC2626' : isSel ? 'var(--plum)' : 'var(--rose-bg)',
                    color: isCorrect || isWrong || isSel ? '#fff' : 'var(--muted)',
                  }}>
                    {isCorrect ? '✓' : isWrong ? '✗' : opt.key.toUpperCase()}
                  </div>
                  <span style={{ fontSize: 15, lineHeight: 1.5, fontWeight: isSel ? 500 : 400, color: isCorrect ? 'var(--success-text)' : isWrong ? 'var(--danger-text)' : 'var(--body)' }}>
                    {opt.text}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {submitted && q.explanation_en && (
            <div style={{ background: 'var(--success-bg)', border: '1px solid #A7F3D0', borderRadius: 10, padding: '14px 16px', marginTop: 4 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--success-text)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Why?</p>
              <p style={{ fontSize: 14, color: 'var(--success-text)', lineHeight: 1.6 }}>{q.explanation_en}</p>
            </div>
          )}
        </div>
      )}

      {/* Fixed bottom */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--white)', borderTop: '1.5px solid var(--border)', padding: '16px 20px 28px' }}>
        {!submitted ? (
          <button className="btn-primary" onClick={submitAnswer} disabled={!selected}>
            Submit answer
          </button>
        ) : (
          <button className="btn-gold" onClick={next} disabled={saving}>
            {saving ? 'Saving...' : current + 1 >= quizzes.length ? 'See my results →' : 'Next question →'}
          </button>
        )}
      </div>
    </div>
  )
}
