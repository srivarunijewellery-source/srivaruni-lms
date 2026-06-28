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
  const [lang, setLang] = useState<'en' | 'te'>('te')
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
    const l = localStorage.getItem('sv_lang') as 'en' | 'te'
    if (!s) { router.push('/staff'); return }
    setStaff(JSON.parse(s))
    if (l) setLang(l)
  }, [])

  useEffect(() => {
    if (!staff) return
    supabase.from('lms_quizzes').select('*')
      .eq('content_id', contentId).order('order_index')
      .then(({ data }) => { setQuizzes(data || []); setLoading(false) })
  }, [staff])

  const q = quizzes[current]

  const options = q ? [
    { key: 'a', en: q.option_a_en, te: q.option_a_te },
    { key: 'b', en: q.option_b_en, te: q.option_b_te },
    { key: 'c', en: q.option_c_en || '', te: q.option_c_te || '' },
    { key: 'd', en: q.option_d_en || '', te: q.option_d_te || '' },
  ].filter(o => o.en) : []

  function submitAnswer() {
    if (!selected || !q) return
    const correct = selected === q.correct_option
    setAnswers(prev => [...prev, { qid: q.id, chosen: selected, correct }])
    setSubmitted(true)
  }

  async function nextQuestion() {
    if (current + 1 >= quizzes.length) {
      // Save results
      setSaving(true)
      const allAnswers = [...answers]
      const score = Math.round((allAnswers.filter(a => a.correct).length / quizzes.length) * 100)
      const passed = score >= 80

      await supabase.from('lms_results').insert({
        assignment_id: assignmentId,
        staff_id: staff.id,
        content_id: contentId,
        score,
        passed,
        attempt_number: 1,
        answers_json: allAnswers,
        completed_at: new Date().toISOString(),
      })
      setSaving(false)
      setDone(true)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setSubmitted(false)
    }
  }

  const score = answers.length > 0
    ? Math.round((answers.filter(a => a.correct).length / quizzes.length) * 100)
    : 0
  const passed = score >= 80

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ivory)' }}>
      <div className="text-2xl">⏳</div>
    </div>
  )

  // Results screen
  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-8"
      style={{ background: passed ? 'var(--plum)' : 'var(--ivory)' }}>
      <div className="text-6xl mb-4">{passed ? '🏆' : '📚'}</div>
      <h1 className="text-2xl font-bold mb-2 text-center"
        style={{ color: passed ? 'white' : 'var(--charcoal)',
          fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
        {passed
          ? (lang === 'te' ? 'అభినందనలు!' : 'Congratulations!')
          : (lang === 'te' ? 'మళ్ళీ ప్రయత్నించండి' : 'Keep Practicing')}
      </h1>

      {/* Score circle */}
      <div className="w-28 h-28 rounded-full flex flex-col items-center justify-center my-6"
        style={{ background: passed ? 'rgba(255,255,255,0.15)' : 'var(--rose)',
          border: `3px solid ${passed ? 'var(--gold)' : 'var(--border)'}` }}>
        <div className="text-3xl font-bold" style={{ color: passed ? 'var(--gold)' : 'var(--plum)' }}>
          {score}%
        </div>
        <div className="text-xs" style={{ color: passed ? 'rgba(255,255,255,0.7)' : 'var(--muted)',
          fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
          {lang === 'te' ? 'స్కోర్' : 'Score'}
        </div>
      </div>

      <p className="text-center text-sm mb-8"
        style={{ color: passed ? 'rgba(255,255,255,0.8)' : 'var(--muted)',
          fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
        {passed
          ? (lang === 'te'
            ? 'మీరు ఈ పాఠాన్ని విజయవంతంగా పూర్తి చేశారు!'
            : 'You passed this lesson successfully!')
          : (lang === 'te'
            ? 'పాస్ కావాలంటే కనీసం 80% కావాలి. పాఠం మళ్ళీ చదివి ప్రయత్నించండి.'
            : 'You need at least 80% to pass. Review the lesson and try again.')}
      </p>

      <div className="w-full space-y-3">
        <button
          onClick={() => router.push(`/staff/course/${courseId}?assignment=${assignmentId}`)}
          className="w-full py-4 rounded-2xl font-semibold text-sm"
          style={{
            background: passed ? 'var(--gold)' : 'var(--plum)',
            color: 'white',
            fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif'
          }}>
          {lang === 'te' ? 'కోర్సుకి వెళ్ళు →' : 'Back to Course →'}
        </button>
        {!passed && (
          <button
            onClick={() => router.push(`/staff/lesson/${contentId}?assignment=${assignmentId}&course=${courseId}`)}
            className="w-full py-4 rounded-2xl font-semibold text-sm"
            style={{ background: 'transparent',
              border: '1.5px solid var(--plum)', color: 'var(--plum)',
              fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
            {lang === 'te' ? 'పాఠం మళ్ళీ చదువు' : 'Review Lesson'}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen pb-32" style={{ background: 'var(--ivory)' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4" style={{ background: 'var(--plum)' }}>
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs tracking-widest uppercase" style={{ color: 'var(--gold)' }}>
            {lang === 'te' ? 'క్విజ్' : 'Quiz'}
          </div>
          <button onClick={() => {
            const nl = lang === 'en' ? 'te' : 'en'
            setLang(nl); localStorage.setItem('sv_lang', nl)
          }}
            className="text-xs px-2.5 py-1 rounded-full border"
            style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
            {lang === 'en' ? 'తెలుగు' : 'English'}
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-3">
          {quizzes.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all"
              style={{
                flex: 1,
                background: i < current ? 'var(--gold)' :
                            i === current ? 'rgba(201,147,58,0.6)' : 'rgba(255,255,255,0.2)'
              }} />
          ))}
        </div>
        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {lang === 'te' ? `ప్రశ్న ${current + 1} / ${quizzes.length}` : `Question ${current + 1} of ${quizzes.length}`}
        </div>
      </div>

      {q && (
        <div className="p-4">
          {/* Question */}
          <div className="rounded-2xl p-5 mb-4"
            style={{ background: 'white', border: '1px solid var(--border)' }}>
            <p className="font-semibold text-base leading-relaxed" style={{ color: 'var(--plum)',
              fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif',
              lineHeight: lang === 'te' ? '2' : '1.6' }}>
              {lang === 'te' ? q.question_te : q.question_en}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-4">
            {options.map(opt => {
              const isSelected = selected === opt.key
              const isCorrect = submitted && opt.key === q.correct_option
              const isWrong   = submitted && isSelected && opt.key !== q.correct_option

              return (
                <button key={opt.key}
                  onClick={() => !submitted && setSelected(opt.key)}
                  disabled={submitted}
                  className="w-full text-left px-4 py-3.5 rounded-2xl transition-all"
                  style={{
                    background: isCorrect ? '#D1FAE5' : isWrong ? '#FEE2E2' :
                                isSelected ? 'rgba(45,27,53,0.08)' : 'white',
                    border: `1.5px solid ${isCorrect ? '#6EE7B7' : isWrong ? '#FCA5A5' :
                             isSelected ? 'var(--plum)' : 'var(--border)'}`,
                  }}>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                      style={{
                        background: isCorrect ? '#10B981' : isWrong ? '#EF4444' :
                                    isSelected ? 'var(--plum)' : 'var(--rose)',
                        color: isSelected || isCorrect || isWrong ? 'white' : 'var(--muted)'
                      }}>
                      {isCorrect ? '✓' : isWrong ? '✗' : opt.key.toUpperCase()}
                    </div>
                    <span className="text-sm" style={{
                      color: isCorrect ? '#065F46' : isWrong ? '#991B1B' : 'var(--charcoal)',
                      fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif',
                      lineHeight: lang === 'te' ? '2' : '1.5'
                    }}>
                      {lang === 'te' ? opt.te : opt.en}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Explanation after submit */}
          {submitted && q.explanation_en && (
            <div className="rounded-2xl p-4 mb-4"
              style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: '#065F46' }}>
                {lang === 'te' ? 'వివరణ' : 'Explanation'}
              </div>
              <p className="text-sm" style={{ color: '#065F46',
                fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif',
                lineHeight: lang === 'te' ? '2' : '1.6' }}>
                {lang === 'te' ? q.explanation_te : q.explanation_en}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4"
        style={{ background: 'var(--ivory)', borderTop: '1px solid var(--border)' }}>
        {!submitted ? (
          <button onClick={submitAnswer} disabled={!selected}
            className="w-full py-4 rounded-2xl font-semibold text-white"
            style={{ background: selected ? 'var(--plum)' : 'var(--muted)',
              fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
            {lang === 'te' ? 'సమాధానం ఇవ్వు' : 'Submit Answer'}
          </button>
        ) : (
          <button onClick={nextQuestion} disabled={saving}
            className="w-full py-4 rounded-2xl font-semibold text-white"
            style={{ background: 'var(--gold)',
              fontFamily: lang === 'te' ? 'Tiro Telugu, serif' : 'DM Sans, sans-serif' }}>
            {saving ? '...' : current + 1 >= quizzes.length
              ? (lang === 'te' ? 'ఫలితాలు చూడు →' : 'See Results →')
              : (lang === 'te' ? 'తర్వాత ప్రశ్న →' : 'Next Question →')}
          </button>
        )}
      </div>
    </div>
  )
}
