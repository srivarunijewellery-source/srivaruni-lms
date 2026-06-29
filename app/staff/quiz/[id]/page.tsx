'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase, type Quiz } from '@/lib/supabase'

export default function QuizPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const contentId = params.id as string
  const assignmentId = searchParams.get('assignment') || ''
  const courseId = searchParams.get('course') || ''

  const [staff, setStaff] = useState<any>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState<{ qid: string; chosen: string; correct: boolean }[]>([])
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const s = localStorage.getItem('sv_staff')
    if (!s) { router.push('/staff'); return }
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
    setAnswers(prev => [...prev, { qid: q.id, chosen: selected, correct: selected === q.correct_option }])
    setSubmitted(true)
  }

  async function nextQuestion() {
    if (current + 1 >= quizzes.length) {
      setSaving(true)
      const all = [...answers]
      const score = Math.round((all.filter(a => a.correct).length / quizzes.length) * 100)
      await supabase.from('lms_results').insert({
        assignment_id: assignmentId, staff_id: staff.id, content_id: contentId,
        score, passed: score >= 80, attempt_number: 1,
        answers_json: all, completed_at: new Date().toISOString(),
      })
      setSaving(false)
      setDone(true)
    } else {
      setCurrent(c => c + 1); setSelected(null); setSubmitted(false)
    }
  }

  const finalScore = Math.round((answers.filter(a => a.correct).length / Math.max(quizzes.length, 1)) * 100)
  const passed = finalScore >= 80

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ivory)' }}>
      <p style={{ color: 'var(--muted)' }}>Loading quiz...</p>
    </div>
  )

  if (done) return (
    <div style={{ minHeight: '100vh', background: passed ? 'var(--plum)' : 'var(--ivory)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>{passed ? '🏆' : '📚'}</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: passed ? '#FFFFFF' : 'var(--charcoal)', marginBottom: 8, textAlign: 'center' }}>
        {passed ? 'Congratulations!' : 'Keep practicing'}
      </h1>
      <div style={{ width: 110, height: 110, borderRadius: '50%', border: `3px solid ${passed ? 'var(--gold-btn)' : 'var(--border-dark)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '20px 0', background: passed ? 'rgba(255,255,255,0.1)' : 'var(--white)' }}>
        <span style={{ fontSize: 30, fontWeight: 700, color: passed ? 'var(--gold-btn)' : 'var(--plum)' }}>{finalScore}%</span>
        <span style={{ fontSize: 12, color: passed ? 'rgba(255,255,255,0.7)' : 'var(--muted)', marginTop: 2 }}>Your score</span>
      </div>
      <p style={{ textAlign: 'center', color: passed ? 'rgba(255,255,255,0.8)' : 'var(--muted)', fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
        {passed ? 'You passed this lesson. Well done!' : 'You need 80% to pass. Review the lesson and try again.'}
      </p>
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn-gold" onClick={() => router.push(`/staff/course/${courseId}?assignment=${assignmentId}`)}>
          Back to course →
        </button>
        {!passed && (
          <button onClick={() => router.push(`/staff/lesson/${contentId}?assignment=${assignmentId}&course=${courseId}`)}
            style={{ background: 'transparent', border: `1.5px solid ${passed ? 'rgba(255,255,255,0.3)' : 'var(--border-dark)'}`, borderRadius: 10, padding: '14px', fontSize: 15, fontWeight: 600, color: passed ? '#FFFFFF' : 'var(--body)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            Review lesson
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)', paddingBottom: 100 }}>
      <div className="nav-bar">
        <span className="nav-title">Quiz</span>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{current + 1} / {quizzes.length}</span>
      </div>

      <div style={{ background: 'var(--plum)', padding: '0 20px 16px', display: 'flex', gap: 5 }}>
        {quizzes.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i < current ? 'var(--gold-btn)' : i === current ? 'rgba(201,147,58,0.5)' : 'rgba(255,255,255,0.2)', transition: 'background 0.2s' }} />
        ))}
      </div>

      {q && (
        <div style={{ padding: '20px 16px 0' }}>
          <div className="card" style={{ padding: '18px 20px', marginBottom: 16 }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--charcoal)', lineHeight: 1.5 }}>{q.question_en}</p>
          </div>

          <div>
            {options.map(opt => {
              const isSelected = selected === opt.key
              const isCorrect  = submitted && opt.key === q.correct_option
              const isWrong    = submitted && isSelected && !isCorrect
              return (
                <button key={opt.key}
                  className={`answer-option ${isCorrect ? 'correct' : isWrong ? 'wrong' : isSelected ? 'selected' : ''}`}
                  onClick={() => !submitted && setSelected(opt.key)}
                  disabled={submitted}>
                  <div className="option-key" style={{
                    background: isCorrect ? '#16A34A' : isWrong ? '#DC2626' : isSelected ? 'var(--plum)' : 'var(--rose-bg)',
                    color: isCorrect || isWrong || isSelected ? '#FFFFFF' : 'var(--muted)',
                  }}>
                    {isCorrect ? '✓' : isWrong ? '✗' : opt.key.toUpperCase()}
                  </div>
                  <span style={{ fontSize: 15, lineHeight: 1.5, color: isCorrect ? 'var(--success-text)' : isWrong ? 'var(--danger-text)' : 'var(--body)', fontWeight: isSelected ? 500 : 400 }}>
                    {opt.text}
                  </span>
                </button>
              )
            })}
          </div>

          {submitted && q.explanation_en && (
            <div style={{ background: 'var(--success-bg)', border: '1px solid #A7F3D0', borderRadius: 10, padding: '14px 16px', marginTop: 4 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--success-text)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Explanation</p>
              <p style={{ fontSize: 14, color: 'var(--success-text)', lineHeight: 1.6 }}>{q.explanation_en}</p>
            </div>
          )}
        </div>
      )}

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--white)', borderTop: '1.5px solid var(--border)', padding: '16px 20px 28px' }}>
        {!submitted ? (
          <button className="btn-primary" onClick={submitAnswer} disabled={!selected}>Submit answer</button>
        ) : (
          <button className="btn-gold" onClick={nextQuestion} disabled={saving}>
            {saving ? 'Saving...' : current + 1 >= quizzes.length ? 'See results →' : 'Next question →'}
          </button>
        )}
      </div>
    </div>
  )
}
